
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
import { hasLunchBreakConflict } from '@/utils/bookingTimeUtils';

/**
 * Fetch lunch breaks for a barber
 * 
 * @param barberId - The ID of the barber
 * @returns Array of lunch break records
 */
export const fetchBarberLunchBreaks = async (barberId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('barber_lunch_breaks')
      .select('*')
      .eq('barber_id', barberId)
      .eq('is_active', true);
      
    if (error) {
      console.error('Error fetching lunch breaks:', error);
      throw error;
    }
    
    console.log(`Fetched ${data?.length || 0} lunch breaks for barber ${barberId}`, data);
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
    console.log(`Fetching time slots for barber ${barberId}, date ${date.toISOString()}, service duration ${serviceDuration}`);
    
    // Get day of week (0 = Sunday, 1 = Monday, etc.)
    // This needs to be the exact day of week for the date we want
    const dayOfWeek = date.getDay();
    console.log(`Day of week for ${date.toDateString()}: ${dayOfWeek}`);
    
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
      console.log(`No opening hours found for barber ${barberId} on day ${dayOfWeek} or barber is closed`);
      return [];
    }
    
    console.log(`Opening hours for barber ${barberId} on day ${dayOfWeek}:`, data);
    
    // Use cached lunch breaks if available, otherwise fetch them
    let lunchBreaks = cachedLunchBreaks;
    
    if (!lunchBreaks || lunchBreaks.length === 0) {
      try {
        lunchBreaks = await fetchBarberLunchBreaks(barberId);
      } catch (err) {
        console.error('Error fetching lunch breaks:', err);
        lunchBreaks = [];
      }
    }
    
    console.log(`Lunch breaks for time slot filtering:`, lunchBreaks);
    
    // Generate all possible time slots
    const possibleSlots = generatePossibleTimeSlots(data.open_time, data.close_time);
    
    // Filter slots based on bookings and lunch breaks
    const availableSlots = filterAvailableTimeSlots(
      possibleSlots,
      serviceDuration,
      existingBookings,
      lunchBreaks
    );
    
    // Filter slots based on other criteria
    const finalSlots = availableSlots.filter(slot => {
      // Check if within opening hours
      const withinHours = isWithinOpeningHours(
        barberId,
        date,
        slot,
        serviceDuration
      );
      
      // Double-check lunch break overlap as a safety measure
      const hasLunchOverlap = hasLunchBreakConflict(
        slot,
        lunchBreaks,
        serviceDuration
      );
      
      // If there's a lunch break overlap, log it and skip this slot
      if (hasLunchOverlap) {
        console.log(`⛔ Double-check caught lunch break overlap for ${slot}`);
        return false;
      }
      
      return withinHours && !hasLunchOverlap;
    });
    
    console.log(`Generated ${finalSlots.length} available time slots for barber ${barberId} on date ${date.toDateString()}`);
    return finalSlots;
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

// Cache for isDateSelectable results
const dateSelectableCache = new Map<string, boolean>();

/**
 * Check if a date is selectable (barber is working that day)
 * 
 * @param date - The date to check
 * @param barberId - The ID of the barber
 * @returns Boolean indicating if the date is selectable
 */
export const isDateSelectable = async (date: Date, barberId: string): Promise<boolean> => {
  try {
    // Create a cache key - using toDateString() for a more readable key
    const cacheKey = `${date.toDateString()}_${barberId}`;
    
    // Check if we have a cached result
    if (dateSelectableCache.has(cacheKey)) {
      return dateSelectableCache.get(cacheKey) || false;
    }
    
    // Get the correct day of week for this date
    const dayOfWeek = date.getDay();
    console.log(`Checking day of week ${dayOfWeek} for date ${date.toDateString()}`);
    
    const { data, error } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking if date is selectable:', error);
      throw error;
    }
    
    const isSelectable = !!(data && !data.is_closed);
    console.log(`Date ${date.toDateString()} selectable: ${isSelectable}, opening hours:`, data);
    
    // Cache the result
    dateSelectableCache.set(cacheKey, isSelectable);
    
    return isSelectable;
  } catch (err) {
    console.error('Error checking if date is selectable:', err);
    return false;
  }
};

/**
 * Clear the date selectable cache
 */
export const clearDateSelectableCache = () => {
  dateSelectableCache.clear();
};
