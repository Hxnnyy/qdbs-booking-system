
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
  
  const openTimeInMinutes = openHours * 60 + openMinutes;
  const closeTimeInMinutes = closeHours * 60 + closeMinutes;
  
  console.log(`Generating time slots from ${openTime} (${openTimeInMinutes} mins) to ${closeTime} (${closeTimeInMinutes} mins)`);
  
  // Safeguard against infinite loops
  let safetyCounter = 0;
  const maxIterations = 200; // Increased to accommodate more 15-min slots
  
  while (safetyCounter < maxIterations) {
    const timeInMinutes = openHours * 60 + openMinutes;
    
    // CRITICAL FIX: Only break the loop when we exceed closing time
    // This allows slots that start before closing time to be included,
    // even if they end exactly at closing time
    if (timeInMinutes >= closeTimeInMinutes) {
      console.log(`Time ${timeInMinutes} mins has reached or exceeded closing time ${closeTimeInMinutes} mins, breaking loop`);
      break;
    }
    
    const formattedHours = openHours.toString().padStart(2, '0');
    const formattedMinutes = openMinutes.toString().padStart(2, '0');
    const timeSlot = `${formattedHours}:${formattedMinutes}`;
    
    slots.push({
      time: timeSlot,
      minutes: timeInMinutes
    });
    
    openMinutes += 15; // 15-minute increments
    if (openMinutes >= 60) {
      openHours += 1;
      openMinutes -= 60;
    }
    
    safetyCounter++;
  }
  
  console.log(`Generated ${slots.length} possible time slots from ${openTime} to ${closeTime}`);
  
  // DEBUG: Log the last few entries to verify closing time logic
  if (slots.length > 0) {
    const lastSlot = slots[slots.length - 1];
    console.log(`Last possible time slot: ${lastSlot.time} (${lastSlot.minutes} minutes from midnight)`);
    console.log(`Closing time is at ${closeTimeInMinutes} minutes from midnight`);
    console.log(`Difference: ${closeTimeInMinutes - lastSlot.minutes} minutes`);
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
  
  console.log(`Filtering ${possibleSlots.length} possible time slots with ${lunchBreaks?.length || 0} lunch breaks`);
  console.log(`Service duration: ${serviceDuration} minutes`);
  
  if (lunchBreaks && lunchBreaks.length > 0) {
    const activeLunchBreaks = lunchBreaks.filter(b => b.is_active);
    console.log("Active lunch breaks:", activeLunchBreaks);
  }
  
  for (const slot of possibleSlots) {
    // Calculate end time for this service
    const slotEndMinutes = slot.minutes + serviceDuration;
    
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
    
    if (isBooked) {
      console.log(`❌ Slot ${slot.time} conflicts with existing booking, skipping`);
      continue;
    }
    
    // Additional check - log time slots close to closing time
    const lastFewSlots = possibleSlots.slice(-3);
    const isCloseToClosing = lastFewSlots.some(s => s.time === slot.time);
    
    if (isCloseToClosing) {
      // Convert end time to HH:MM format
      const endHours = Math.floor(slotEndMinutes / 60);
      const endMins = slotEndMinutes % 60;
      const formattedEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      
      console.log(`⚠️ Late slot check: ${slot.time} ends at ${formattedEndTime} (${slotEndMinutes} minutes)`);
    }
    
    availableSlots.push(slot.time);
  }
  
  // Log the last slot for debugging
  if (availableSlots.length > 0) {
    const lastSlot = availableSlots[availableSlots.length - 1];
    console.log(`Last available slot after filtering: ${lastSlot}`);
    
    // Calculate when this would end
    const [hours, minutes] = lastSlot.split(':').map(Number);
    const lastSlotMinutes = hours * 60 + minutes;
    const endTimeMinutes = lastSlotMinutes + serviceDuration;
    const endTimeHours = Math.floor(endTimeMinutes / 60);
    const endTimeMinutesRemainder = endTimeMinutes % 60;
    
    console.log(`This slot would end at: ${endTimeHours.toString().padStart(2, '0')}:${endTimeMinutesRemainder.toString().padStart(2, '0')}`);
  }
  
  console.log(`Filtered down to ${availableSlots.length} available slots`);
  
  return availableSlots;
};
