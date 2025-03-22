
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
 * Check if a time slot overlaps with a lunch break
 * 
 * @param timeSlot - The time slot to check
 * @param date - The date of the time slot
 * @param lunchBreaks - Array of lunch breaks to check against
 * @param serviceDuration - Duration of the service in minutes
 * @returns Boolean indicating if the time slot overlaps with a lunch break
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
  
  console.log(`SERVICE: Checking lunch break overlap for ${timeSlot} with duration ${serviceDuration}min`);
  
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotStart = new Date(date);
  slotStart.setHours(hours, minutes, 0, 0);
  
  const slotEnd = new Date(slotStart);
  slotEnd.setMinutes(slotEnd.getMinutes() + serviceDuration);
  
  // Calculate start and end in minutes for easier comparison
  const slotStartMinutes = hours * 60 + minutes;
  const slotEndMinutes = slotStartMinutes + serviceDuration;
  
  // Log the active lunch breaks for debugging
  const activeLunchBreaks = lunchBreaks.filter(lb => lb.is_active);
  if (activeLunchBreaks.length > 0) {
    console.log(`SERVICE: Active lunch breaks for checking ${timeSlot}:`, activeLunchBreaks);
  }
  
  for (const lunch of lunchBreaks) {
    if (!lunch.is_active) continue;
    
    const [lunchHours, lunchMinutes] = lunch.start_time.split(':').map(Number);
    const lunchStartMinutes = lunchHours * 60 + lunchMinutes;
    const lunchEndMinutes = lunchStartMinutes + lunch.duration;
    
    // Enhanced overlap check with detailed logging
    // A time slot overlaps with a lunch break if:
    // 1. Time slot starts during lunch break
    // 2. Time slot ends during lunch break
    // 3. Time slot completely contains lunch break
    // 4. Lunch break completely contains time slot
    const slotStartsDuringBreak = slotStartMinutes >= lunchStartMinutes && slotStartMinutes < lunchEndMinutes;
    const slotEndsDuringBreak = slotEndMinutes > lunchStartMinutes && slotEndMinutes <= lunchEndMinutes;
    const slotContainsBreak = slotStartMinutes <= lunchStartMinutes && slotEndMinutes >= lunchEndMinutes;
    const breakContainsSlot = slotStartMinutes >= lunchStartMinutes && slotEndMinutes <= lunchEndMinutes;
    
    const hasOverlap = slotStartsDuringBreak || slotEndsDuringBreak || slotContainsBreak || breakContainsSlot;
    
    // Log the calculation for debugging
    console.log(`SERVICE: Lunch break: ${lunch.start_time} for ${lunch.duration}min (${lunchStartMinutes}-${lunchEndMinutes})`);
    console.log(`SERVICE: Service slot: ${timeSlot} for ${serviceDuration}min (${slotStartMinutes}-${slotEndMinutes})`);
    console.log(`SERVICE: Overlap conditions: Start during break: ${slotStartsDuringBreak}, End during break: ${slotEndsDuringBreak}, Contains break: ${slotContainsBreak}, Inside break: ${breakContainsSlot}`);
    console.log(`SERVICE: Overall overlap: ${hasOverlap ? 'YES' : 'NO'}`);
    
    if (hasOverlap) {
      return true;
    }
  }
  
  return false;
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
        // Continue without lunch breaks rather than failing entirely
        lunchBreaks = [];
      }
    }
    
    console.log(`SERVICE: Processing time slots with ${lunchBreaks.length} lunch breaks for service duration ${serviceDuration}min`);
    
    // Generate all possible time slots
    const possibleSlots = generatePossibleTimeSlots(data.open_time, data.close_time);
    
    // First level filtering - booking conflicts and lunch breaks
    const availableSlots = filterAvailableTimeSlots(
      possibleSlots,
      serviceDuration,
      existingBookings,
      lunchBreaks
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
      
      // Double-check lunch break overlap with both methods
      // Method 1: Using the utility function from timeSlotUtils
      const utilLunchCheck = isLunchBreak(
        slot,
        lunchBreaks,
        serviceDuration
      );
      
      // Method 2: Using the timeSlotService implementation
      const serviceLunchCheck = isLunchBreakOverlap(
        slot,
        date,
        lunchBreaks,
        serviceDuration
      );
      
      const hasLunchOverlap = utilLunchCheck || serviceLunchCheck;
      
      // Log extensively for debugging
      if (utilLunchCheck !== serviceLunchCheck) {
        console.log(`WARNING: Inconsistent lunch break detection for ${slot}! utilCheck=${utilLunchCheck}, serviceCheck=${serviceLunchCheck}`);
      }
      
      // If there's a lunch break overlap, log it and skip this slot
      if (hasLunchOverlap) {
        console.log(`⛔ SERVICE FILTERING: Excluding time slot ${slot} due to lunch break overlap`);
        continue;
      }
      
      // Only add the slot if it passes all checks
      if (withinHours && !hasLunchOverlap) {
        finalSlots.push(slot);
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
