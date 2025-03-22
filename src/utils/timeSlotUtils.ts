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
  if (!lunchBreaks || lunchBreaks.length === 0) {
    return false;
  }
  
  // Only check active lunch breaks
  const activeLunchBreaks = lunchBreaks.filter(lb => lb.is_active);
  if (activeLunchBreaks.length === 0) {
    return false;
  }

  // Convert time slot to minutes for easier calculation
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const timeSlotStart = hours * 60 + minutes;
  const timeSlotEnd = timeSlotStart + serviceDuration;

  // Debug log
  console.log(`LUNCH CHECK: Slot ${timeSlot} (${timeSlotStart}-${timeSlotEnd} mins), duration: ${serviceDuration}min`);
  
  // Check each lunch break for overlap
  for (const lunchBreak of activeLunchBreaks) {
    if (!lunchBreak.is_active) {
      continue;
    }

    const [lunchHours, lunchMinutes] = lunchBreak.start_time.split(':').map(Number);
    const lunchStart = lunchHours * 60 + lunchMinutes;
    const lunchEnd = lunchStart + lunchBreak.duration;
    
    console.log(`Checking against lunch break: ${lunchBreak.start_time} (${lunchStart}-${lunchEnd} mins), duration: ${lunchBreak.duration}min`);

    // Simplified overlap check
    const hasOverlap = (
      // Case 1: Time slot starts during lunch
      (timeSlotStart >= lunchStart && timeSlotStart < lunchEnd) ||
      // Case 2: Time slot ends during lunch
      (timeSlotEnd > lunchStart && timeSlotEnd <= lunchEnd) ||
      // Case 3: Time slot contains lunch entirely
      (timeSlotStart <= lunchStart && timeSlotEnd >= lunchEnd)
    );
    
    if (hasOverlap) {
      console.log(`⛔ LUNCH OVERLAP DETECTED: ${timeSlot} conflicts with lunch at ${lunchBreak.start_time}`);
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
    const activeBreaks = lunchBreaks.filter(b => b.is_active);
    console.log(`Active lunch breaks count: ${activeBreaks.length}`);
    activeBreaks.forEach(b => {
      console.log(`- ${b.start_time} for ${b.duration} minutes`);
    });
  }
  
  for (const slot of possibleSlots) {
    // Check if slot is booked by an existing appointment
    const isBooked = isTimeSlotBooked(
      slot.time, 
      { duration: serviceDuration } as any, 
      existingBookings
    );
    
    // Check if slot overlaps with lunch break
    const isLunchTime = isLunchBreak(
      slot.time, 
      lunchBreaks, 
      serviceDuration
    );
    
    // Skip slots that are either booked or during lunch
    if (isBooked) {
      console.log(`❌ Slot ${slot.time} is already booked, skipping`);
      continue;
    }
    
    if (isLunchTime) {
      console.log(`❌ Slot ${slot.time} is during lunch break, skipping`);
      continue;
    }
    
    availableSlots.push(slot.time);
  }
  
  console.log(`Filtered down to ${availableSlots.length} available slots:`, availableSlots);
  
  return availableSlots;
};
