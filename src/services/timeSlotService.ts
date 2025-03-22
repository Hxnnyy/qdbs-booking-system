
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
    if (!barberId) {
      console.log('No barber ID provided for lunch break fetch');
      return [];
    }
    
    const { data, error } = await supabase
      .from('barber_lunch_breaks')
      .select('*')
      .eq('barber_id', barberId);
      
    if (error) {
      console.error('Error fetching lunch breaks:', error);
      throw error;
    }
    
    const activeBreaks = data?.filter(breakTime => breakTime.is_active) || [];
    console.log(`Fetched ${data?.length || 0} lunch breaks for barber ${barberId}, ${activeBreaks.length} active breaks`);
    
    if (activeBreaks.length > 0) {
      activeBreaks.forEach(breakTime => {
        console.log(`Active lunch break: ${breakTime.start_time} (${breakTime.duration}min)`);
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
    console.log(`Fetching time slots for barber ${barberId} on ${date.toISOString()}, service duration: ${serviceDuration}min`);
    const dayOfWeek = date.getDay();
    
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
    
    // Use cached lunch breaks if available, otherwise fetch them
    const lunchBreaks = cachedLunchBreaks && cachedLunchBreaks.length > 0 
      ? cachedLunchBreaks 
      : await fetchBarberLunchBreaks(barberId);
    
    console.log(`Processing lunch breaks for filtering: ${lunchBreaks.length} breaks found`);
    
    // Log active lunch breaks
    const activeLunchBreaks = lunchBreaks.filter(breakTime => breakTime.is_active);
    console.log(`${activeLunchBreaks.length} active lunch breaks found`);
    
    // Generate all possible time slots
    const possibleSlots = generatePossibleTimeSlots(data.open_time, data.close_time);
    console.log(`Generated ${possibleSlots.length} possible time slots from ${data.open_time} to ${data.close_time}`);
    
    // First pass: Filter out slots that overlap with lunch breaks and existing bookings
    const initialFilteredSlots = filterAvailableTimeSlots(
      possibleSlots,
      serviceDuration,
      existingBookings,
      lunchBreaks
    );
    
    console.log(`After initial filtering: ${initialFilteredSlots.length} slots available`);
    
    // Second pass: Further filter slots based on opening hours
    const withinOpeningHoursSlots = [];
    
    for (const slot of initialFilteredSlots) {
      // Double-check for lunch break overlap directly
      const lunchBreakOverlap = isLunchBreak(slot, lunchBreaks, serviceDuration);
      
      if (lunchBreakOverlap) {
        console.log(`Skipping slot ${slot} due to lunch break overlap (secondary check)`);
        continue;
      }
      
      const withinHours = await isWithinOpeningHours(
        barberId,
        date,
        slot,
        serviceDuration
      );
      
      if (withinHours) {
        withinOpeningHoursSlots.push(slot);
      } else {
        console.log(`Skipping slot ${slot} as it's not within opening hours`);
      }
    }
    
    console.log(`Final available slots: ${withinOpeningHoursSlots.length}`);
    return withinOpeningHoursSlots;
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
