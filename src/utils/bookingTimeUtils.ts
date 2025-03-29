
/**
 * Booking Time Utilities
 * 
 * Helper functions for time-related operations in the booking flow
 */

import { CalendarEvent } from '@/types/calendar';
import { format, isToday, isFuture, isSameDay, addDays } from 'date-fns';

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
  
  // Convert time slot to minutes for easier calculation
  const [slotHours, slotMinutes] = timeSlot.split(':').map(Number);
  const slotStartMinutes = slotHours * 60 + slotMinutes;
  
  // Calculate when this service would end
  const slotEndMinutes = slotStartMinutes + serviceDuration;

  console.log(`Checking lunch breaks for slot ${timeSlot} (${slotStartMinutes}-${slotEndMinutes} mins)`);
  
  // Check each lunch break for conflicts
  for (const breakItem of lunchBreaks) {
    if (!breakItem.is_active) continue;
    
    // Only process active lunch breaks
    // Convert lunch break time to minutes
    const breakStartTime = breakItem.start_time;
    const [breakHours, breakMinutes] = breakStartTime.split(':').map(Number);
    const breakStartMinutes = breakHours * 60 + breakMinutes;
    
    // Get break duration
    const breakDuration = breakItem.duration || 60; // Default to 60 if not specified
    
    // Calculate when lunch break ends
    const breakEndMinutes = breakStartMinutes + breakDuration;
    
    console.log(`Checking lunch break: ${breakStartTime} (${breakStartMinutes}-${breakEndMinutes} mins), Duration: ${breakDuration} mins`);
    
    // Check for overlap
    // 1. Appointment starts during lunch break
    // 2. Appointment ends during lunch break
    // 3. Appointment completely contains lunch break
    // 4. Lunch break completely contains appointment
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
    
    // Skip dates where the barber is on holiday
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
