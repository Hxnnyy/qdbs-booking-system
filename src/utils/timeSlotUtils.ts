
/**
 * Time Slot Utilities
 * 
 * Utility functions for generating and filtering time slots
 */

import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/supabase-types';
import { isWithinOpeningHours, isTimeSlotBooked } from '@/utils/bookingUtils';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';

/**
 * Check if a time slot overlaps with a lunch break
 * 
 * @param timeSlot - Time slot in "HH:MM" format
 * @param lunchBreaks - Array of lunch break records
 * @param serviceDuration - Duration of the service in minutes
 * @returns Boolean indicating if the time slot overlaps with a lunch break
 */
export const isLunchBreak = (
  timeSlot: string,
  lunchBreaks: any[],
  serviceDuration: number
): boolean => {
  if (!lunchBreaks || lunchBreaks.length === 0) return false;
  
  // Filter to only active lunch breaks
  const activeLunchBreaks = lunchBreaks.filter(breakTime => breakTime.is_active);
  if (activeLunchBreaks.length === 0) return false;
  
  // Convert time slot time to minutes for comparison
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  const timeSlotEndMinutes = timeInMinutes + serviceDuration;
  
  return activeLunchBreaks.some(breakTime => {
    // Skip if break time is not in the correct format
    if (!breakTime.start_time || typeof breakTime.start_time !== 'string') {
      console.log('Invalid lunch break format:', breakTime);
      return false;
    }
    
    const [breakHours, breakMinutes] = breakTime.start_time.split(':').map(Number);
    const breakStartMinutes = breakHours * 60 + breakMinutes;
    const breakEndMinutes = breakStartMinutes + breakTime.duration;
    
    console.log(`Checking time slot ${timeSlot} (${timeInMinutes}-${timeSlotEndMinutes}) against lunch break ${breakTime.start_time} (${breakStartMinutes}-${breakEndMinutes})`);
    
    // Check if slot starts during lunch break
    const startsInLunchBreak = timeInMinutes >= breakStartMinutes && timeInMinutes < breakEndMinutes;
    
    // Check if service would overlap with lunch break
    const overlapsWithLunchBreak = timeInMinutes < breakStartMinutes && timeSlotEndMinutes > breakStartMinutes;
    
    // Check if service entirely contains the lunch break
    const containsLunchBreak = timeInMinutes <= breakStartMinutes && timeSlotEndMinutes >= breakEndMinutes;
    
    const isOverlapping = startsInLunchBreak || overlapsWithLunchBreak || containsLunchBreak;
    
    if (isOverlapping) {
      console.log(`Time slot ${timeSlot} overlaps with lunch break ${breakTime.start_time} (${breakTime.duration} mins)`);
    }
    
    return isOverlapping;
  });
};

/**
 * Generate all possible time slots for a day
 * 
 * @param openTime - Opening time in "HH:MM" format
 * @param closeTime - Closing time in "HH:MM" format
 * @returns Array of possible time slots with time string and minutes from midnight
 */
export const generatePossibleTimeSlots = (
  openTime: string,
  closeTime: string
): {time: string, minutes: number}[] => {
  const slots: {time: string, minutes: number}[] = [];
  
  let [openHours, openMinutes] = openTime.split(':').map(Number);
  const [closeHours, closeMinutes] = closeTime.split(':').map(Number);
  
  const closeTimeInMinutes = closeHours * 60 + closeMinutes;
  
  while (true) {
    const timeInMinutes = openHours * 60 + openMinutes;
    if (timeInMinutes >= closeTimeInMinutes) {
      break;
    }
    
    const formattedHours = openHours.toString().padStart(2, '0');
    const formattedMinutes = openMinutes.toString().padStart(2, '0');
    const timeSlot = `${formattedHours}:${formattedMinutes}`;
    
    slots.push({
      time: timeSlot,
      minutes: timeInMinutes
    });
    
    openMinutes += 30; // 30-minute increments
    if (openMinutes >= 60) {
      openHours += 1;
      openMinutes -= 60;
    }
  }
  
  return slots;
};

/**
 * Filter time slots based on booking criteria
 * 
 * @param possibleSlots - Array of possible time slots
 * @param serviceDuration - Duration of the service in minutes
 * @param existingBookings - Array of existing bookings
 * @param lunchBreaks - Array of lunch break records
 * @returns Array of available time slots in "HH:MM" format
 */
export const filterAvailableTimeSlots = (
  possibleSlots: {time: string, minutes: number}[],
  serviceDuration: number,
  existingBookings: any[],
  lunchBreaks: any[]
): string[] => {
  const availableSlots: string[] = [];
  console.log(`Filtering ${possibleSlots.length} time slots with ${lunchBreaks?.length || 0} lunch breaks`);
  
  for (const slot of possibleSlots) {
    const isBooked = isTimeSlotBooked(
      slot.time, 
      { duration: serviceDuration } as any, 
      existingBookings
    );
    
    const isOnLunchBreak = isLunchBreak(slot.time, lunchBreaks, serviceDuration);
    
    if (!isBooked && !isOnLunchBreak) {
      availableSlots.push(slot.time);
    } else if (isOnLunchBreak) {
      console.log(`Excluding time slot ${slot.time} due to lunch break overlap`);
    }
  }
  
  console.log(`Found ${availableSlots.length} available slots after filtering`);
  return availableSlots;
};
