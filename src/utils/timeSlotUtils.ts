
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
  
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const slotStartMinutes = hours * 60 + minutes;
  const slotEndMinutes = slotStartMinutes + serviceDuration;
  
  return lunchBreaks.some(breakTime => {
    // Get lunch break start time in minutes
    const [breakHours, breakMinutes] = breakTime.start_time.split(':').map(Number);
    const breakStartMinutes = breakHours * 60 + breakMinutes;
    
    // Calculate lunch break end time in minutes
    const breakEndMinutes = breakStartMinutes + breakTime.duration;
    
    // Check various overlap scenarios
    // 1. Service starts during lunch break
    // 2. Service ends during lunch break
    // 3. Service completely contains lunch break
    // 4. Service is completely within lunch break
    return (
      (slotStartMinutes >= breakStartMinutes && slotStartMinutes < breakEndMinutes) || // Start during break
      (slotEndMinutes > breakStartMinutes && slotEndMinutes <= breakEndMinutes) || // End during break
      (slotStartMinutes <= breakStartMinutes && slotEndMinutes >= breakEndMinutes) || // Contains break
      (slotStartMinutes >= breakStartMinutes && slotEndMinutes <= breakEndMinutes) // Within break
    );
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
  
  for (const slot of possibleSlots) {
    const isBooked = isTimeSlotBooked(
      slot.time, 
      { duration: serviceDuration } as any, 
      existingBookings
    );
    
    const isOnLunchBreak = isLunchBreak(slot.time, lunchBreaks, serviceDuration);
    
    if (!isBooked && !isOnLunchBreak) {
      availableSlots.push(slot.time);
    }
  }
  
  return availableSlots;
};
