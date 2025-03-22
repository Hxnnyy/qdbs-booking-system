
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
  const timeInMinutes = hours * 60 + minutes;
  const serviceEndMinutes = timeInMinutes + serviceDuration;
  
  // Log for debugging
  console.log(`Checking lunch break: Slot starts at ${timeInMinutes} minutes (${timeSlot}), ends at ${serviceEndMinutes} minutes, service duration: ${serviceDuration}min`);
  
  for (const breakTime of lunchBreaks) {
    if (!breakTime.is_active) continue;
    
    const [breakHours, breakMinutes] = breakTime.start_time.split(':').map(Number);
    const breakStartMinutes = breakHours * 60 + breakMinutes;
    const breakEndMinutes = breakStartMinutes + breakTime.duration;
    
    // Improved overlap check
    const hasOverlap = (
      // Service starts during lunch break
      (timeInMinutes >= breakStartMinutes && timeInMinutes < breakEndMinutes) ||
      // Service ends during lunch break
      (serviceEndMinutes > breakStartMinutes && serviceEndMinutes <= breakEndMinutes) ||
      // Service completely contains lunch break
      (timeInMinutes < breakStartMinutes && serviceEndMinutes > breakEndMinutes)
    );
    
    // Log for debugging
    console.log(`Lunch break: ${breakTime.start_time} (${breakStartMinutes} mins) to ${breakEndMinutes} mins, duration: ${breakTime.duration}min`);
    console.log(`Overlap check result: ${hasOverlap ? 'OVERLAPS' : 'No overlap'}`);
    
    if (hasOverlap) {
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
  
  console.log(`Filtering ${possibleSlots.length} possible time slots with ${lunchBreaks?.length || 0} lunch breaks`);
  console.log(`Service duration: ${serviceDuration} minutes`);
  
  if (lunchBreaks && lunchBreaks.length > 0) {
    console.log("Active lunch breaks:");
    lunchBreaks.filter(b => b.is_active).forEach(b => {
      console.log(`- ${b.start_time} for ${b.duration} minutes`);
    });
  }
  
  for (const slot of possibleSlots) {
    const isBooked = isTimeSlotBooked(
      slot.time, 
      { duration: serviceDuration } as any, 
      existingBookings
    );
    
    const isOnLunchBreak = isLunchBreak(slot.time, lunchBreaks, serviceDuration);
    
    if (isOnLunchBreak) {
      console.log(`❌ Slot ${slot.time} is during lunch break, skipping`);
    }
    
    if (!isBooked && !isOnLunchBreak) {
      availableSlots.push(slot.time);
    }
  }
  
  console.log(`Filtered down to ${availableSlots.length} available slots:`, availableSlots);
  
  return availableSlots;
};
