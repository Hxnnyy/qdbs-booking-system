
/**
 * Time Slot Service
 * 
 * Handles data fetching and processing related to barber time slots and availability
 */

import { supabase } from '@/integrations/supabase/client';
import { generatePossibleTimeSlots, filterAvailableTimeSlots } from '@/utils/timeSlotUtils';
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
    if (!barberId) return [];
    
    const { data, error } = await supabase
      .from('barber_lunch_breaks')
      .select('*')
      .eq('barber_id', barberId);
      
    if (error) throw error;
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
    const dayOfWeek = date.getDay();
    
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
      return [];
    }
    
    // Use cached lunch breaks if available, otherwise fetch them
    const lunchBreaks = cachedLunchBreaks && cachedLunchBreaks.length > 0 
      ? cachedLunchBreaks 
      : await fetchBarberLunchBreaks(barberId);
    
    // Generate all possible time slots
    const possibleSlots = generatePossibleTimeSlots(data.open_time, data.close_time);
    
    // Filter slots based on availability and lunch breaks
    const availableSlots = filterAvailableTimeSlots(
      possibleSlots,
      serviceDuration,
      existingBookings,
      lunchBreaks
    );
    
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
      }
    }
    
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
