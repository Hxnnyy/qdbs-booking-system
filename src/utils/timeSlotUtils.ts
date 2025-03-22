
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
  
  console.log(`Checking lunch break for time slot ${timeSlot}, service duration: ${serviceDuration}`);
  console.log(`Number of lunch breaks to check: ${lunchBreaks.length}`);
  
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotStartMinutes = hours * 60 + minutes;
  const slotEndMinutes = slotStartMinutes + serviceDuration;
  
  for (const breakTime of lunchBreaks) {
    // Get lunch break start time in minutes
    const [breakHours, breakMinutes] = breakTime.start_time.split(':').map(Number);
    const breakStartMinutes = breakHours * 60 + breakMinutes;
    
    // Calculate lunch break end time in minutes
    const breakEndMinutes = breakStartMinutes + breakTime.duration;
    
    // Log for debugging
    console.log(`Lunch break: ${breakTime.start_time} to ${breakHours}:${breakMinutes + breakTime.duration}, duration: ${breakTime.duration}`);
    console.log(`Service slot: ${timeSlot} to ${Math.floor(slotEndMinutes/60)}:${slotEndMinutes%60}, duration: ${serviceDuration}`);
    
    // Check various overlap scenarios
    // 1. Service starts during lunch break
    // 2. Service ends during lunch break
    // 3. Service completely contains lunch break
    // 4. Service is completely within lunch break
    const overlaps = (
      (slotStartMinutes >= breakStartMinutes && slotStartMinutes < breakEndMinutes) || // Start during break
      (slotEndMinutes > breakStartMinutes && slotEndMinutes <= breakEndMinutes) || // End during break
      (slotStartMinutes <= breakStartMinutes && slotEndMinutes >= breakEndMinutes) || // Contains break
      (slotStartMinutes >= breakStartMinutes && slotEndMinutes <= breakEndMinutes) // Within break
    );
    
    if (overlaps) {
      console.log(`OVERLAP DETECTED for time slot ${timeSlot} with lunch break ${breakTime.start_time}`);
      return true;
    }
  }
  
  return false;
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
  
  console.log(`Generating time slots from ${openTime} to ${closeTime}`);
  
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
  
  console.log(`Generated ${slots.length} possible time slots`);
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
  console.log(`Filtering ${possibleSlots.length} time slots`);
  console.log(`Service duration: ${serviceDuration} minutes`);
  console.log(`Existing bookings: ${existingBookings.length}`);
  console.log(`Lunch breaks: ${lunchBreaks.length}`);
  
  const availableSlots: string[] = [];
  
  for (const slot of possibleSlots) {
    const isBooked = isTimeSlotBooked(
      slot.time, 
      { duration: serviceDuration } as any, 
      existingBookings
    );
    
    const isOnLunchBreak = isLunchBreak(slot.time, lunchBreaks, serviceDuration);
    
    if (isBooked) {
      console.log(`Slot ${slot.time} is already booked`);
    }
    
    if (isOnLunchBreak) {
      console.log(`Slot ${slot.time} overlaps with lunch break`);
    }
    
    if (!isBooked && !isOnLunchBreak) {
      availableSlots.push(slot.time);
    }
  }
  
  console.log(`Found ${availableSlots.length} available slots after filtering`);
  return availableSlots;
};
