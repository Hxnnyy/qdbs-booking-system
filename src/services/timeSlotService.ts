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
 */
export const fetchBarberLunchBreaks = async (barberId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('barber_lunch_breaks')
      .select('*')
      .eq('barber_id', barberId);
      
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
 * Check if a time slot overlaps with a lunch break
 */
export const isLunchBreakOverlap = (
  timeSlot: string,
  date: Date,
  lunchBreaks: any[],
  serviceDuration: number
): boolean => {
  if (!lunchBreaks || !lunchBreaks.length) {
    return false;
  }
  
  // Only check active lunch breaks
  const activeLunchBreaks = lunchBreaks.filter(b => b.is_active);
  if (activeLunchBreaks.length === 0) {
    return false;
  }
  
  console.log(`SERVICE: Checking lunch break overlap for ${timeSlot} with duration ${serviceDuration}min`);
  
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotStartMinutes = hours * 60 + minutes;
  const slotEndMinutes = slotStartMinutes + serviceDuration;
  
  for (const lunch of activeLunchBreaks) {
    const [lunchHours, lunchMinutes] = lunch.start_time.split(':').map(Number);
    const lunchStartMinutes = lunchHours * 60 + lunchMinutes;
    const lunchEndMinutes = lunchStartMinutes + lunch.duration;
    
    // Simplified overlap check
    const hasOverlap = (
      // Time slot starts during lunch break
      (slotStartMinutes >= lunchStartMinutes && slotStartMinutes < lunchEndMinutes) ||
      // Time slot ends during lunch break
      (slotEndMinutes > lunchStartMinutes && slotEndMinutes <= lunchEndMinutes) ||
      // Time slot completely contains lunch break
      (slotStartMinutes <= lunchStartMinutes && slotEndMinutes >= lunchEndMinutes)
    );
    
    if (hasOverlap) {
      console.log(`SERVICE: ⛔ OVERLAP DETECTED with lunch break at ${lunch.start_time}`);
      return true;
    }
  }
  
  return false;
};

/**
 * Fetch available time slots for a barber on a specific date
 */
export const fetchBarberTimeSlots = async (
  barberId: string, 
  date: Date, 
  serviceDuration: number,
  existingBookings: any[] = [],
  cachedLunchBreaks: any[] = []
): Promise<string[]> => {
  try {
    console.log(`SERVICE: Fetching time slots for barber ${barberId}, date ${date.toISOString()}, service duration ${serviceDuration}`);
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
      console.log(`No opening hours found for barber ${barberId} on day ${dayOfWeek} or barber is closed`);
      return [];
    }
    
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
    
    // Only consider active lunch breaks
    const activeLunchBreaks = lunchBreaks.filter(b => b.is_active);
    console.log(`SERVICE: Processing time slots with ${activeLunchBreaks.length} active lunch breaks`);
    
    // Generate all possible time slots
    const possibleSlots = generatePossibleTimeSlots(data.open_time, data.close_time);
    
    // First level filtering - booking conflicts and lunch breaks
    const availableSlots = filterAvailableTimeSlots(
      possibleSlots,
      serviceDuration,
      existingBookings,
      activeLunchBreaks
    );
    
    // Second level filtering - additional checks
    const finalSlots: string[] = [];
    
    for (const slot of availableSlots) {
      // Check if within opening hours
      const withinHours = await isWithinOpeningHours(
        barberId,
        date,
        slot,
        serviceDuration
      );
      
      // Double-check lunch break overlap
      const hasLunchOverlap = isLunchBreakOverlap(
        slot,
        date,
        activeLunchBreaks,
        serviceDuration
      );
      
      // Only add the slot if it passes all checks
      if (withinHours && !hasLunchOverlap) {
        finalSlots.push(slot);
      } else if (hasLunchOverlap) {
        console.log(`SERVICE FINAL CHECK: Excluding ${slot} due to lunch break overlap`);
      }
    }
    
    console.log(`SERVICE: Generated ${finalSlots.length} available time slots for barber ${barberId} on date ${date.toDateString()}`);
    return finalSlots;
  } catch (error) {
    console.error('Error fetching barber time slots:', error);
    return [];
  }
};

/**
 * Check if a barber is available on a date
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
 */
export const isDateSelectable = async (date: Date, barberId: string): Promise<boolean> => {
  try {
    // Create a cache key
    const cacheKey = `${date.toDateString()}-${barberId}`;
    
    // Check if we have a cached result
    if (dateSelectableCache.has(cacheKey)) {
      return dateSelectableCache.get(cacheKey) || false;
    }
    
    const dayOfWeek = date.getDay();
    
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
