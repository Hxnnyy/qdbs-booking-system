
/**
 * Time Slot Service
 * 
 * Handles data fetching and processing related to barber time slots and availability
 */

import { supabase } from '@/integrations/supabase/client';
import { generatePossibleTimeSlots, filterAvailableTimeSlots, isLunchBreak } from '@/utils/timeSlotUtils';
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
    console.log(`Fetching lunch breaks for barber: ${barberId}`);
    
    const { data, error } = await supabase
      .from('barber_lunch_breaks')
      .select('*')
      .eq('barber_id', barberId)
      .eq('is_active', true);
      
    if (error) throw error;
    
    console.log(`Found ${data?.length || 0} lunch breaks for barber ${barberId}`);
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
    console.log(`Fetching time slots for barber: ${barberId}, date: ${date.toISOString()}, duration: ${serviceDuration}`);
    
    const dayOfWeek = date.getDay();
    
    // Filter existing bookings to only include this barber's bookings
    const barberBookings = existingBookings.filter(booking => 
      booking.barber_id === barberId || !booking.barber_id
    );
    
    console.log(`Found ${barberBookings.length} existing bookings for this barber`);
    
    const { data, error } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    if (!data || data.is_closed) {
      console.log(`Barber ${barberId} is not working on day ${dayOfWeek}`);
      return [];
    }
    
    console.log(`Barber hours: ${data.open_time} - ${data.close_time}`);
    
    // Use cached lunch breaks if available, otherwise fetch them
    let lunchBreaks = cachedLunchBreaks;
    
    if (!lunchBreaks || lunchBreaks.length === 0) {
      console.log('No cached lunch breaks, fetching from database');
      lunchBreaks = await fetchBarberLunchBreaks(barberId);
    }
    
    console.log(`Processing ${lunchBreaks.length} lunch breaks for barber ${barberId}`);
    
    // Generate all possible time slots
    const possibleSlots = generatePossibleTimeSlots(data.open_time, data.close_time);
    
    // Filter slots based on availability
    const availableSlots = filterAvailableTimeSlots(
      possibleSlots,
      serviceDuration,
      barberBookings,
      lunchBreaks
    );
    
    console.log(`After filtering by bookings and lunch: ${availableSlots.length} slots available`);
    
    // Further filter slots based on opening hours
    const withinOpeningHoursSlots = [];
    
    for (const slot of availableSlots) {
      const withinHours = await isWithinOpeningHours(
        barberId,
        date,
        slot,
        serviceDuration
      );
      
      if (withinHours) {
        withinOpeningHoursSlots.push(slot);
      } else {
        console.log(`Slot ${slot} is outside of opening hours`);
      }
    }
    
    console.log(`After filtering by opening hours: ${withinOpeningHoursSlots.length} slots available`);
    
    // Filter out slots that are in the past
    const nonPastSlots = withinOpeningHoursSlots.filter(slot => !isTimeSlotInPast(date, slot));
    
    console.log(`Final available slots: ${nonPastSlots.length}`);
    return nonPastSlots;
    
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
  
  // Handle "any barber" case differently
  if (barberId === 'any') {
    return { isAvailable: true, errorMessage: null };
  }
  
  console.log(`Checking holiday status for barber ${barberId} on ${date.toISOString()}`);
  const isHoliday = isBarberHolidayDate(calendarEvents, date, barberId);
  
  if (isHoliday) {
    console.log(`Barber ${barberId} is on holiday on ${date.toISOString()}`);
    return { 
      isAvailable: false, 
      errorMessage: 'Barber is on holiday on this date.' 
    };
  }
  
  return { isAvailable: true, errorMessage: null };
};
