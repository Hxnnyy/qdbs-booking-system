/**
 * Booking Time Utilities
 * 
 * Helper functions for time-related operations in the booking flow
 */

import { CalendarEvent } from '@/types/calendar';
import { format, isToday, isFuture, isSameDay, addDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

/**
 * Check if a time slot is in the past
 * 
 * @param date - Selected date
 * @param time - Time slot (HH:MM format)
 * @returns Boolean indicating if the time is in the past
 */
export const isTimeInPast = (date: Date, time: string): boolean => {
  const now = new Date();
  const [hours, minutes] = time.split(':').map(Number);
  
  const selectedDateTime = new Date(date);
  selectedDateTime.setHours(hours, minutes, 0, 0);
  
  return selectedDateTime <= now;
};

/**
 * Get a message for when no time slots are available
 * 
 * @param selectedDate - The selected date
 * @returns A user-friendly message
 */
export const getNoTimeSlotsMessage = (selectedDate?: Date): string => {
  if (!selectedDate) {
    return 'No available time slots';
  }
  
  if (isToday(selectedDate)) {
    return 'No available time slots for today';
  }
  
  return `No available time slots on ${format(selectedDate, 'EEEE, MMMM d')}`;
};

/**
 * Check if a time slot overlaps with a lunch break
 * 
 * @param timeSlot - Time slot in "HH:MM" format
 * @param lunchBreaks - Array of lunch break records
 * @param serviceDuration - Duration of the service in minutes
 * @returns Boolean indicating if the time slot overlaps with a lunch break
 */
export const hasLunchBreakConflict = (
  timeSlot: string,
  lunchBreaks: any[],
  serviceDuration: number
): boolean => {
  if (!lunchBreaks || lunchBreaks.length === 0) {
    return false;
  }
  
  const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
  const slotStartMinutes = slotHours * 60 + slotMinutes;
  
  const slotEndMinutes = slotStartMinutes + serviceDuration;

  console.log(`Checking lunch breaks for slot ${timeSlot} (${slotStartMinutes}-${slotEndMinutes} mins)`);
  
  for (const breakItem of lunchBreaks) {
    if (!breakItem.is_active) continue;
    
    const breakStartTime = breakItem.start_time;
    const [breakHours, breakMinutes] = breakStartTime.split(':').map(Number);
    const breakStartMinutes = breakHours * 60 + breakMinutes;
    
    const breakDuration = breakItem.duration || 60;
    
    const breakEndMinutes = breakStartMinutes + breakDuration;
    
    console.log(`Checking lunch break: ${breakStartTime} (${breakStartMinutes}-${breakEndMinutes} mins), Duration: ${breakDuration} mins`);
    
    const hasOverlap = (
      (slotStartMinutes >= breakStartMinutes && slotStartMinutes < breakEndMinutes) ||
      (slotEndMinutes > breakStartMinutes && slotEndMinutes <= breakEndMinutes) ||
      (slotStartMinutes <= breakStartMinutes && slotEndMinutes >= breakEndMinutes) ||
      (slotStartMinutes >= breakStartMinutes && slotEndMinutes <= breakEndMinutes)
    );
    
    if (hasOverlap) {
      console.log(`⚠️ Lunch break conflict detected for slot ${timeSlot}`);
      return true;
    }
  }
  
  return false;
};

/**
 * Check if a day has available time slots for the barber
 * 
 * @param barberId - The ID of the barber
 * @param date - The date to check
 * @param existingBookings - Array of existing bookings
 * @param serviceDuration - Duration of the service in minutes
 * @returns Promise that resolves to a boolean indicating if day has available slots
 */
export const hasAvailableSlotsOnDay = async (
  barberId: string | null,
  date: Date,
  existingBookings: any[] = [],
  serviceDuration: number = 60
): Promise<boolean> => {
  if (!barberId) return false;

  try {
    const dayOfWeek = date.getDay();
    
    const { data: openingHours, error } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching opening hours:', error);
      return false;
    }
    
    if (!openingHours || openingHours.is_closed) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking day availability:', error);
    return false;
  }
};

/**
 * Find dates with available time slots for a barber
 * 
 * @param barberId - The ID of the barber
 * @param serviceDuration - Duration of the service in minutes
 * @param calendarEvents - Array of calendar events to check against
 * @param daysToCheck - Number of days to check ahead
 * @returns Array of dates that may have available time slots
 */
export const findDatesWithAvailableSlots = async (
  barberId: string | null,
  serviceDuration: number = 60,
  calendarEvents: CalendarEvent[] = [],
  daysToCheck: number = 14
): Promise<Date[]> => {
  if (!barberId) return [];
  
  const availableDates: Date[] = [];
  const now = new Date();
  
  for (let i = 0; i < daysToCheck; i++) {
    const checkDate = addDays(now, i);
    
    const isHoliday = calendarEvents.some(event => 
      event.barberId === barberId && 
      event.status === 'holiday' &&
      isSameDay(event.start, checkDate)
    );
    
    if (isHoliday) continue;
    
    const hasSlots = await hasAvailableSlotsOnDay(
      barberId, 
      checkDate, 
      [], // We're just doing a basic check, not accounting for existing bookings
      serviceDuration
    );
    
    if (hasSlots) {
      availableDates.push(checkDate);
    }
  }
  
  return availableDates;
};
