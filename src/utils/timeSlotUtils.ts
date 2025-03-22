
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
  // Early exit if no lunch breaks
  if (!lunchBreaks || lunchBreaks.length === 0) return false;
  
  // Filter to only active lunch breaks
  const activeLunchBreaks = lunchBreaks.filter(breakTime => breakTime.is_active);
  if (activeLunchBreaks.length === 0) return false;
  
  // Convert time slot time to minutes for comparison
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  // Calculate the end time of this appointment
  const timeSlotEndMinutes = timeInMinutes + serviceDuration;
  
  console.log(`Checking time slot ${timeSlot} (duration: ${serviceDuration}min) against ${activeLunchBreaks.length} lunch breaks`);
  
  // Check against each active lunch break
  return activeLunchBreaks.some(breakTime => {
    // Skip if break time is not in the correct format
    if (!breakTime.start_time || typeof breakTime.start_time !== 'string') {
      console.log('Invalid lunch break format:', breakTime);
      return false;
    }
    
    // Parse lunch break time
    const [breakHours, breakMinutes] = breakTime.start_time.split(':').map(Number);
    const breakStartMinutes = breakHours * 60 + breakMinutes;
    const breakEndMinutes = breakStartMinutes + breakTime.duration;
    
    console.log(`Checking time slot ${timeSlot} (${timeInMinutes}-${timeSlotEndMinutes}min) against lunch break ${breakTime.start_time} (${breakStartMinutes}-${breakEndMinutes}min)`);
    
    // Four possible overlap conditions:
    
    // 1. Appointment starts during lunch break
    const startsInLunchBreak = timeInMinutes >= breakStartMinutes && timeInMinutes < breakEndMinutes;
    
    // 2. Appointment ends during lunch break
    const endsInLunchBreak = timeSlotEndMinutes > breakStartMinutes && timeSlotEndMinutes <= breakEndMinutes;
    
    // 3. Appointment completely contains lunch break
    const containsLunchBreak = timeInMinutes <= breakStartMinutes && timeSlotEndMinutes >= breakEndMinutes;
    
    // 4. Appointment is completely contained by lunch break
    const containedByLunchBreak = timeInMinutes >= breakStartMinutes && timeSlotEndMinutes <= breakEndMinutes;
    
    // Any of these conditions means there's an overlap
    const isOverlapping = startsInLunchBreak || endsInLunchBreak || containsLunchBreak || containedByLunchBreak;
    
    if (isOverlapping) {
      console.log(`Time slot ${timeSlot} OVERLAPS with lunch break ${breakTime.start_time} (${breakTime.duration}min)`);
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
  
  // Log lunch break details for debugging
  if (lunchBreaks && lunchBreaks.length > 0) {
    lunchBreaks.forEach(breakTime => {
      if (breakTime.is_active) {
        console.log(`Active lunch break: ${breakTime.start_time} (${breakTime.duration}min)`);
      }
    });
  }
  
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
    } else if (isBooked) {
      console.log(`Excluding time slot ${slot.time} due to existing booking`);
    }
  }
  
  console.log(`Found ${availableSlots.length} available slots after filtering`);
  return availableSlots;
};
