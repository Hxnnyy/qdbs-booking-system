
/**
 * Booking Time Utilities
 * 
 * Utility functions related to booking time management
 */

import { isTimeSlotInPast, isSameDay } from '@/utils/bookingUpdateUtils';
import { format } from 'date-fns';

/**
 * Filter time slots to remove past times for the current day
 * 
 * @param date - The selected date
 * @param timeSlots - Array of time slots in "HH:MM" format
 * @returns Filtered array of time slots
 */
export const filterPastTimeSlots = (date: Date | undefined, timeSlots: string[]): string[] => {
  if (!date) return [];
  
  return timeSlots.filter(time => !isTimeSlotInPast(date, time));
};

/**
 * Get appropriate error message when no time slots are available
 * 
 * @param date - The selected date
 * @returns Error message string
 */
export const getNoTimeSlotsMessage = (date: Date | undefined): string => {
  if (!date) return "No available time slots";
  
  return isSameDay(date, new Date()) && isTimeSlotInPast(date, "23:59") 
    ? "No more available time slots for today." 
    : "No available time slots for this date.";
};

/**
 * Format date and time for display
 * 
 * @param date - Date string in "YYYY-MM-DD" format
 * @param time - Time string in "HH:MM" format
 * @returns Formatted date and time string
 */
export const formatBookingDateTime = (date: string, time: string): string => {
  try {
    const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');
    return `${formattedDate} at ${time}`;
  } catch (error) {
    console.error('Error formatting date time:', error);
    return `${date} at ${time}`;
  }
};

/**
 * Check if a time slot has a lunch break conflict
 * 
 * @param timeSlot - Time slot string in "HH:MM" format
 * @param lunchBreaks - Array of lunch break objects
 * @param serviceDuration - Duration of the service in minutes
 * @returns Boolean indicating if there's a lunch break conflict
 */
export const hasLunchBreakConflict = (
  timeSlot: string, 
  lunchBreaks: any[], 
  serviceDuration: number
): boolean => {
  if (!lunchBreaks || lunchBreaks.length === 0) return false;
  
  // Only consider active lunch breaks
  const activeLunchBreaks = lunchBreaks.filter(lb => lb.is_active);
  if (activeLunchBreaks.length === 0) return false;
  
  // Convert time slot to minutes for easier comparison
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  // Calculate end time of the appointment in minutes
  const endTimeInMinutes = timeInMinutes + serviceDuration;
  
  // Check against each lunch break
  for (const lunch of activeLunchBreaks) {
    // Convert lunch break time to minutes
    const [lunchHours, lunchMinutes] = lunch.start_time.split(':').map(Number);
    const lunchStartMinutes = lunchHours * 60 + lunchMinutes;
    const lunchEndMinutes = lunchStartMinutes + lunch.duration;
    
    // Check for overlap:
    // If the appointment starts before lunch ends AND appointment ends after lunch starts,
    // then there's an overlap
    if (timeInMinutes < lunchEndMinutes && endTimeInMinutes > lunchStartMinutes) {
      return true;
    }
  }
  
  return false;
};
