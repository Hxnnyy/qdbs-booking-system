
/**
 * Time Slot Service
 * 
 * Handles data fetching and processing related to barber time slots and availability
 */

import { supabase } from '@/integrations/supabase/client';
import { format, addMinutes, parse } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';

/**
 * Fetch lunch breaks for a barber
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
    
    return data || [];
  } catch (err) {
    console.error('Error fetching lunch breaks:', err);
    return [];
  }
};

/**
 * Check if a time slot overlaps with a lunch break
 */
export const doesTimeOverlapLunchBreak = (
  timeSlot: string,
  serviceDuration: number,
  lunchBreaks: any[]
): boolean => {
  if (!lunchBreaks || lunchBreaks.length === 0) return false;

  // Only consider active lunch breaks
  const activeBreaks = lunchBreaks.filter(breakTime => breakTime.is_active);
  if (activeBreaks.length === 0) return false;

  // Parse the time slot
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const timeSlotStart = hours * 60 + minutes;
  const timeSlotEnd = timeSlotStart + serviceDuration;

  // Check if the time slot overlaps with any lunch break
  for (const lunchBreak of activeBreaks) {
    const [breakHours, breakMinutes] = lunchBreak.start_time.split(':').map(Number);
    const breakStart = breakHours * 60 + breakMinutes;
    const breakEnd = breakStart + lunchBreak.duration;

    // Check for overlap (four cases):
    // 1. Time slot starts during lunch break
    // 2. Time slot ends during lunch break
    // 3. Time slot completely contains lunch break
    // 4. Time slot is completely contained by lunch break
    const overlaps = (
      (timeSlotStart >= breakStart && timeSlotStart < breakEnd) ||
      (timeSlotEnd > breakStart && timeSlotEnd <= breakEnd) ||
      (timeSlotStart <= breakStart && timeSlotEnd >= breakEnd) ||
      (timeSlotStart >= breakStart && timeSlotEnd <= breakEnd)
    );

    if (overlaps) {
      console.log(`Time ${timeSlot} (duration: ${serviceDuration}) overlaps with lunch break: ${lunchBreak.start_time} (${lunchBreak.duration} min)`);
      return true;
    }
  }

  return false;
};

/**
 * Check if a time slot overlaps with existing bookings
 */
export const doesTimeOverlapBookings = (
  timeSlot: string,
  serviceDuration: number,
  existingBookings: any[]
): boolean => {
  if (!existingBookings || existingBookings.length === 0) return false;

  // Parse the time slot
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const timeSlotStart = hours * 60 + minutes;
  const timeSlotEnd = timeSlotStart + serviceDuration;

  // Check if the time slot overlaps with any existing booking
  for (const booking of existingBookings) {
    if (!booking.booking_time) continue;

    // Calculate booking start time in minutes
    const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
    const bookingStart = bookingHours * 60 + bookingMinutes;
    
    // Calculate booking duration (default to 60 minutes if not available)
    const bookingDuration = booking.services?.duration || 60;
    const bookingEnd = bookingStart + bookingDuration;

    // Check for overlap (four cases)
    const overlaps = (
      (timeSlotStart >= bookingStart && timeSlotStart < bookingEnd) ||
      (timeSlotEnd > bookingStart && timeSlotEnd <= bookingEnd) ||
      (timeSlotStart <= bookingStart && timeSlotEnd >= bookingEnd) ||
      (timeSlotStart >= bookingStart && timeSlotEnd <= bookingEnd)
    );

    if (overlaps) {
      console.log(`Time ${timeSlot} overlaps with existing booking at ${booking.booking_time}`);
      return true;
    }
  }

  return false;
};

/**
 * Check if a date is a barber holiday
 */
export const isBarberHolidayDate = (
  calendarEvents: CalendarEvent[],
  date: Date,
  barberId?: string | null
): boolean => {
  if (!calendarEvents || calendarEvents.length === 0 || !barberId) return false;
  
  const targetDateStr = format(date, 'yyyy-MM-dd');
  
  // Filter events to only get holidays for this barber
  const barberEvents = calendarEvents.filter(event => 
    event.barberId === barberId && 
    event.status === 'holiday' &&
    event.allDay === true
  );
  
  // Check if the date falls within any holiday period
  for (const event of barberEvents) {
    const eventStartDate = new Date(event.start);
    const eventEndDate = new Date(event.end);
    
    // Normalize dates to compare only the date part
    const eventStartStr = format(eventStartDate, 'yyyy-MM-dd');
    const eventEndStr = format(eventEndDate, 'yyyy-MM-dd');
    
    if (targetDateStr >= eventStartStr && targetDateStr <= eventEndStr) {
      console.log(`Date ${targetDateStr} falls within holiday: ${event.title}`);
      return true;
    }
  }
  
  return false;
};

/**
 * Get working hours for a specific barber and day
 */
export const getBarberWorkingHours = async (barberId: string, dayOfWeek: number) => {
  try {
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
    
    return data;
  } catch (err) {
    console.error('Error getting barber working hours:', err);
    return null;
  }
};

/**
 * Generate time slots from open to close time
 */
export const generateTimeSlots = (openTime: string, closeTime: string): string[] => {
  const slots: string[] = [];
  
  // Parse times into minutes
  const [openHours, openMinutes] = openTime.split(':').map(Number);
  const openInMinutes = openHours * 60 + openMinutes;
  
  const [closeHours, closeMinutes] = closeTime.split(':').map(Number);
  const closeInMinutes = closeHours * 60 + closeMinutes;
  
  // Generate 30-minute interval slots
  for (let time = openInMinutes; time < closeInMinutes; time += 30) {
    const hours = Math.floor(time / 60);
    const minutes = time % 60;
    const timeSlot = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    slots.push(timeSlot);
  }
  
  return slots;
};

/**
 * Check if a time slot is in the past
 */
export const isTimeInPast = (date: Date, timeSlot: string): boolean => {
  const now = new Date();
  const slotDate = new Date(date);
  const [hours, minutes] = timeSlot.split(':').map(Number);
  
  slotDate.setHours(hours, minutes, 0, 0);
  
  return slotDate < now;
};

/**
 * Fetch available time slots for a barber on a specific date
 */
export const fetchBarberTimeSlots = async (
  barberId: string, 
  date: Date, 
  serviceDuration: number,
  existingBookings: any[] = [],
  lunchBreaks: any[] = []
): Promise<string[]> => {
  try {
    console.log(`===== FETCHING TIME SLOTS =====`);
    console.log(`Barber: ${barberId}, Date: ${format(date, 'yyyy-MM-dd')}, Service Duration: ${serviceDuration}min`);
    
    const dayOfWeek = date.getDay();
    
    // Fetch opening hours for the selected day
    const workingHours = await getBarberWorkingHours(barberId, dayOfWeek);
    
    if (!workingHours || workingHours.is_closed) {
      console.log('Barber is closed on this day');
      return [];
    }
    
    console.log(`Barber working hours: ${workingHours.open_time} to ${workingHours.close_time}`);
    
    // Generate all possible time slots based on opening hours
    const allPossibleSlots = generateTimeSlots(workingHours.open_time, workingHours.close_time);
    console.log(`Generated ${allPossibleSlots.length} possible time slots`);
    
    // Apply filters one by one to get available slots
    
    // 1. Filter out slots that are in the past
    const notPastSlots = allPossibleSlots.filter(slot => !isTimeInPast(date, slot));
    console.log(`After filtering past times: ${notPastSlots.length} slots available`);
    
    // 2. Filter out slots that overlap with lunch breaks
    const noLunchBreakSlots = notPastSlots.filter(slot => 
      !doesTimeOverlapLunchBreak(slot, serviceDuration, lunchBreaks)
    );
    console.log(`After lunch break filtering: ${noLunchBreakSlots.length} slots available`);
    
    // 3. Filter out slots that overlap with existing bookings
    const noBookingOverlapSlots = noLunchBreakSlots.filter(slot =>
      !doesTimeOverlapBookings(slot, serviceDuration, existingBookings)
    );
    console.log(`After booking overlap filtering: ${noBookingOverlapSlots.length} slots available`);
    
    // 4. Final check - ensure service can complete before closing time
    const finalAvailableSlots = noBookingOverlapSlots.filter(slot => {
      const [hours, minutes] = slot.split(':').map(Number);
      const slotStartMinutes = hours * 60 + minutes;
      const slotEndMinutes = slotStartMinutes + serviceDuration;
      
      const [closeHours, closeMinutes] = workingHours.close_time.split(':').map(Number);
      const closeTimeMinutes = closeHours * 60 + closeMinutes;
      
      return slotEndMinutes <= closeTimeMinutes;
    });
    
    console.log(`Final available slots after all filters: ${finalAvailableSlots.length}`);
    if (finalAvailableSlots.length > 0) {
      console.log(`Available slots: ${finalAvailableSlots.join(', ')}`);
    }
    
    return finalAvailableSlots;
  } catch (error) {
    console.error('Error fetching barber time slots:', error);
    return [];
  }
};

/**
 * Check if a barber is available on a date
 * 
 * This function has been updated to ensure it returns a non-Promise result
 */
export const checkBarberAvailability = async (
  date: Date | undefined,
  barberId: string | null,
  calendarEvents: CalendarEvent[] = []
): Promise<{ isAvailable: boolean, errorMessage: string | null }> => {
  if (!date || !barberId) {
    return { isAvailable: false, errorMessage: "Invalid date or barber selection" };
  }
  
  // 1. Check if date is a holiday
  if (isBarberHolidayDate(calendarEvents, date, barberId)) {
    return { 
      isAvailable: false, 
      errorMessage: 'Barber is on holiday on this date.' 
    };
  }
  
  // 2. Check if barber works on this day
  const dayOfWeek = date.getDay();
  const workingHours = await getBarberWorkingHours(barberId, dayOfWeek);
  
  if (!workingHours || workingHours.is_closed) {
    return {
      isAvailable: false,
      errorMessage: 'Barber does not work on this day.'
    };
  }
  
  return { isAvailable: true, errorMessage: null };
};

/**
 * Create a cache for date selectability to avoid repeated calculations
 */
const dateSelectabilityCache = new Map<string, boolean>();

/**
 * Check if a specific date is selectable in the calendar
 * 
 * Modified to ensure it returns a boolean synchronously and not a Promise
 */
export const isDateSelectable = async (
  date: Date,
  barberId: string | null,
  calendarEvents: CalendarEvent[] = []
): Promise<boolean> => {
  if (!barberId) return false;
  
  // Generate a cache key
  const cacheKey = `${format(date, 'yyyy-MM-dd')}_${barberId}`;
  
  // Check if we have a cached result
  if (dateSelectabilityCache.has(cacheKey)) {
    return dateSelectabilityCache.get(cacheKey) || false;
  }
  
  // Check if date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    dateSelectabilityCache.set(cacheKey, false);
    return false;
  }
  
  // Check if date is a holiday
  if (isBarberHolidayDate(calendarEvents, date, barberId)) {
    dateSelectabilityCache.set(cacheKey, false);
    return false;
  }
  
  // Check if barber works on this day
  const dayOfWeek = date.getDay();
  const workingHours = await getBarberWorkingHours(barberId, dayOfWeek);
  
  const result = !(!workingHours || workingHours.is_closed);
  dateSelectabilityCache.set(cacheKey, result);
  
  return result;
};
