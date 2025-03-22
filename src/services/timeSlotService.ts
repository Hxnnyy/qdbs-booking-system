
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
      
    if (error) throw error;
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
  
  console.log(`Checking lunch break overlap for ${timeSlot} with duration ${serviceDuration}min`);
  
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
  console.log(`Active lunch breaks:`, activeLunchBreaks);
  
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
    const condition1 = slotStartMinutes >= lunchStartMinutes && slotStartMinutes < lunchEndMinutes;
    const condition2 = slotEndMinutes > lunchStartMinutes && slotEndMinutes <= lunchEndMinutes;
    const condition3 = slotStartMinutes <= lunchStartMinutes && slotEndMinutes >= lunchEndMinutes;
    const condition4 = slotStartMinutes >= lunchStartMinutes && slotEndMinutes <= lunchEndMinutes;
    
    const hasOverlap = condition1 || condition2 || condition3 || condition4;
    
    // Log the calculation for debugging
    console.log(`Lunch break: ${lunch.start_time} for ${lunch.duration}min (${lunchStartMinutes}-${lunchEndMinutes})`);
    console.log(`Service slot: ${timeSlot} for ${serviceDuration}min (${slotStartMinutes}-${slotEndMinutes})`);
    console.log(`Overlap conditions: Start during break: ${condition1}, End during break: ${condition2}, Contains break: ${condition3}, Inside break: ${condition4}`);
    console.log(`Overall overlap: ${hasOverlap ? 'YES' : 'NO'}`);
    
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
      console.log(`No opening hours found for barber ${barberId} on day ${dayOfWeek} or barber is closed`);
      return [];
    }
    
    // Use cached lunch breaks if available, otherwise fetch them
    let lunchBreaks = cachedLunchBreaks;
    
    if (!lunchBreaks || lunchBreaks.length === 0) {
      lunchBreaks = await fetchBarberLunchBreaks(barberId);
    }
    
    console.log(`Processing time slots with ${lunchBreaks.length} lunch breaks for service duration ${serviceDuration}min`);
    
    // Generate all possible time slots
    const possibleSlots = generatePossibleTimeSlots(data.open_time, data.close_time);
    
    // Filter slots based on availability
    const availableSlots = filterAvailableTimeSlots(
      possibleSlots,
      serviceDuration,
      existingBookings,
      lunchBreaks
    );
    
    // Further filter slots based on opening hours and lunch breaks
    const filteredSlots = [];
    
    for (const slot of availableSlots) {
      const withinHours = await isWithinOpeningHours(
        barberId,
        date,
        slot,
        serviceDuration
      );
      
      // Use both lunch break checking methods to be thorough
      const directLunchOverlap = isLunchBreak(
        slot,
        lunchBreaks,
        serviceDuration
      );
      
      const contextualLunchOverlap = isLunchBreakOverlap(
        slot,
        date,
        lunchBreaks,
        serviceDuration
      );
      
      const hasLunchOverlap = directLunchOverlap || contextualLunchOverlap;
      
      if (hasLunchOverlap) {
        console.log(`⛔ Filtering out time slot ${slot} due to lunch break overlap`);
      }
      
      if (withinHours && !hasLunchOverlap) {
        filteredSlots.push(slot);
      }
    }
    
    console.log(`Generated ${filteredSlots.length} available time slots for barber ${barberId} on date ${date.toDateString()}`);
    return filteredSlots;
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
      
    if (error) throw error;
    
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
