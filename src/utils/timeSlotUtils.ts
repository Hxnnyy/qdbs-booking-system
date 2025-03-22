
/**
 * Time Slot Utilities
 * 
 * Utility functions for generating and filtering time slots
 */

import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/supabase-types';
import { isWithinOpeningHours, isTimeSlotBooked } from '@/utils/bookingUtils';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';
import { hasLunchBreakConflict } from '@/utils/bookingTimeUtils';

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
  // Use the more reliable function from bookingTimeUtils
  return hasLunchBreakConflict(timeSlot, lunchBreaks, serviceDuration);
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
  
  // Safeguard against infinite loops
  let safetyCounter = 0;
  const maxIterations = 100; // Reasonable limit for a day's worth of 30-min slots
  
  while (safetyCounter < maxIterations) {
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
    
    safetyCounter++;
  }
  
  console.log(`Generated ${slots.length} possible time slots from ${openTime} to ${closeTime}`);
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
  
  console.log(`Filtering ${possibleSlots.length} possible time slots with ${lunchBreaks?.length || 0} lunch breaks`);
  console.log(`Service duration: ${serviceDuration} minutes`);
  
  if (lunchBreaks && lunchBreaks.length > 0) {
    const activeLunchBreaks = lunchBreaks.filter(b => b.is_active);
    console.log("Active lunch breaks:", activeLunchBreaks);
  }
  
  for (const slot of possibleSlots) {
    // Create a simplified booking check that treats lunch breaks as bookings
    const isBooked = isTimeSlotBooked(
      slot.time, 
      { duration: serviceDuration } as any, 
      existingBookings
    );
    
    // Separate lunch break check
    const isOnLunchBreak = hasLunchBreakConflict(
      slot.time, 
      lunchBreaks, 
      serviceDuration
    );
    
    if (isOnLunchBreak) {
      console.log(`❌ Slot ${slot.time} is during lunch break, skipping`);
      continue;
    }
    
    if (!isBooked) {
      availableSlots.push(slot.time);
    }
  }
  
  console.log(`Filtered down to ${availableSlots.length} available slots:`, availableSlots);
  
  return availableSlots;
};
