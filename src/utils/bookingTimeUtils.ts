
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
