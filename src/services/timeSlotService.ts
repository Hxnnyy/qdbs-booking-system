
/**
 * Time Slot Service
 * 
 * Handles data fetching and processing related to barber time slots and availability
 */

import { supabase } from '@/integrations/supabase/client';
import { generatePossibleTimeSlots } from '@/utils/timeSlotUtils';
import { filterOutLunchBreakOverlaps } from '@/utils/lunchBreakUtils';
import { isWithinOpeningHours } from '@/utils/bookingUtils';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { CalendarEvent } from '@/types/calendar';

/**
 * Fetch lunch breaks for a barber
 * 
 * @param barberId - The ID of the barber
 * @returns Array of lunch break records
 */
export const fetchBarberLunchBreaks = async (barberId: string): Promise<any[]> => {
  try {
    if (!barberId) {
      console.log('No barber ID provided for lunch break fetch');
      return [];
    }
    
    console.log(`Fetching lunch breaks for barber: ${barberId}`);
    
    const { data, error } = await supabase
      .from('barber_lunch_breaks')
      .select('*')
      .eq('barber_id', barberId);
      
    if (error) {
      console.error('Error fetching lunch breaks:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} lunch breaks for barber ${barberId}`);
    
    // Log detailed info about active lunch breaks
    const activeBreaks = data?.filter(breakTime => breakTime.is_active) || [];
    console.log(`Found ${activeBreaks.length} active lunch breaks`);
    
    if (activeBreaks.length > 0) {
      activeBreaks.forEach(breakTime => {
        console.log(`Active lunch break ID ${breakTime.id}: ${breakTime.start_time} (${breakTime.duration}min)`);
      });
    }
    
    return data || [];
  } catch (err) {
    console.error('Error fetching lunch breaks:', err);
    return [];
  }
};

/**
 * Fetch available time slots for a barber on a specific date
 * 
 * @param barberId - The ID of the barber
 * @param date - The date to check for availability
 * @param serviceDuration - Duration of the service in minutes
 * @param existingBookings - Array of existing bookings for the date
 * @param cachedLunchBreaks - Optional pre-fetched lunch breaks to avoid redundant API calls
 * @returns Array of available time slots in "HH:MM" format
 */
export const fetchBarberTimeSlots = async (
  barberId: string, 
  date: Date, 
  serviceDuration: number,
  existingBookings: any[] = [],
  cachedLunchBreaks: any[] = []
): Promise<string[]> => {
  try {
    const formattedDate = date.toISOString().split('T')[0];
    console.log(`===== FETCHING TIME SLOTS =====`);
    console.log(`Barber: ${barberId}, Date: ${formattedDate}, Service Duration: ${serviceDuration}min`);
    
    const dayOfWeek = date.getDay();
    
    // Fetch opening hours for the selected day
    const { data, error } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching opening hours:', error);
      throw error;
    }
    
    if (!data || data.is_closed) {
      console.log('Barber is closed on this day or no opening hours found');
      return [];
    }
    
    console.log(`Barber opening hours: ${data.open_time} to ${data.close_time}`);
    
    // Use cached lunch breaks if available, otherwise fetch them
    let lunchBreaks = cachedLunchBreaks;
    if (!lunchBreaks || lunchBreaks.length === 0) {
      console.log(`No cached lunch breaks, fetching fresh data`);
      lunchBreaks = await fetchBarberLunchBreaks(barberId);
    } else {
      console.log(`Using ${lunchBreaks.length} cached lunch breaks`);
    }
    
    // Generate all possible time slots based on opening hours
    const possibleSlots = generatePossibleTimeSlots(data.open_time, data.close_time);
    console.log(`Generated ${possibleSlots.length} possible time slots`);
    
    // Convert possible slots to time strings
    const timeStrings = possibleSlots.map(slot => slot.time);
    
    // Step 1: Filter out slots that are in the past
    const notPastSlots = timeStrings.filter(slot => !isTimeSlotInPast(date, slot));
    console.log(`After filtering past times: ${notPastSlots.length} slots available`);
    
    // Step 2: Filter out slots that already have bookings
    const noBookingSlots = notPastSlots.filter(slot => {
      const isBooked = existingBookings.some(booking => {
        return booking.time === slot || 
          (booking.start_time <= slot && 
           booking.end_time > slot);
      });
      return !isBooked;
    });
    console.log(`After filtering existing bookings: ${noBookingSlots.length} slots available`);
    
    // Step 3: Apply lunch break filtering using our consolidated utility
    const noLunchSlots = filterOutLunchBreakOverlaps(
      noBookingSlots,
      serviceDuration,
      lunchBreaks
    );
    console.log(`After lunch break filtering: ${noLunchSlots.length} slots available`);
    
    // Step 4: Final check to ensure slots are within opening hours
    const finalAvailableSlots = [];
    
    for (const slot of noLunchSlots) {
      const withinHours = await isWithinOpeningHours(
        barberId,
        date,
        slot,
        serviceDuration
      );
      
      if (withinHours) {
        finalAvailableSlots.push(slot);
      } else {
        console.log(`Skipping slot ${slot} as it's not within opening hours`);
      }
    }
    
    console.log(`Final available slots: ${finalAvailableSlots.length}`);
    console.log(`===== END FETCHING TIME SLOTS =====`);
    
    return finalAvailableSlots;
  } catch (error) {
    console.error('Error fetching barber time slots:', error);
    return [];
  }
};

/**
 * Check if a barber is available on a date
 * 
 * @param date - The date to check
 * @param barberId - The ID of the barber
 * @param calendarEvents - Array of calendar events to check against
 * @returns Object with availability status and error message
 */
export const checkBarberAvailability = (
  date: Date | undefined,
  barberId: string | null,
  calendarEvents: CalendarEvent[]
): { isAvailable: boolean, errorMessage: string | null } => {
  if (!date || !barberId) {
    return { isAvailable: true, errorMessage: null };
  }
  
  const isHoliday = isBarberHolidayDate(calendarEvents, date, barberId);
  
  if (isHoliday) {
    return { 
      isAvailable: false, 
      errorMessage: 'Barber is on holiday on this date.' 
    };
  }
  
  return { isAvailable: true, errorMessage: null };
};
