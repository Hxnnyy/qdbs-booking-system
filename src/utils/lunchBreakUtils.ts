/**
 * Lunch Break Utilities
 * 
 * Consolidated utility functions for handling lunch break logic
 */

import { format } from 'date-fns';

/**
 * Converts a time string in "HH:MM" format to minutes since midnight
 */
export const timeToMinutes = (timeString: string): number => {
  if (!timeString || typeof timeString !== 'string') {
    console.error('Invalid time string provided to timeToMinutes:', timeString);
    return 0;
  }
  
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Converts minutes since midnight to a time string in "HH:MM" format
 */
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Represents a time range with start and end times in minutes since midnight
 */
export interface TimeRange {
  start: number;
  end: number;
}

/**
 * Creates a TimeRange from a start time and duration
 */
export const createTimeRange = (startTime: string, durationMinutes: number): TimeRange => {
  const startMinutes = timeToMinutes(startTime);
  return {
    start: startMinutes,
    end: startMinutes + durationMinutes
  };
};

/**
 * Checks if two time ranges overlap
 * This is the core function that determines if a time slot overlaps with a lunch break
 */
export const doTimeRangesOverlap = (range1: TimeRange, range2: TimeRange): boolean => {
  // Time ranges overlap if:
  // 1. range1 starts during range2
  // 2. range1 ends during range2
  // 3. range1 completely contains range2
  // 4. range1 is completely contained by range2
  
  const result = (
    (range1.start >= range2.start && range1.start < range2.end) || // Case 1
    (range1.end > range2.start && range1.end <= range2.end) ||     // Case 2
    (range1.start <= range2.start && range1.end >= range2.end) ||  // Case 3
    (range1.start >= range2.start && range1.end <= range2.end)     // Case 4
  );
  
  // Enhanced logging for overlap detection
  if (result) {
    console.log(
      `OVERLAP DETECTED: Appointment ${minutesToTime(range1.start)}-${minutesToTime(range1.end)} ` +
      `overlaps with lunch break ${minutesToTime(range2.start)}-${minutesToTime(range2.end)}`
    );
  }
  
  return result;
};

/**
 * Check if a specific lunch break is valid and active
 */
export const isValidLunchBreak = (lunchBreak: any): boolean => {
  if (!lunchBreak) return false;
  
  // Must be active
  if (!lunchBreak.is_active) return false;
  
  // Must have valid start time and duration
  if (!lunchBreak.start_time || typeof lunchBreak.start_time !== 'string') return false;
  if (!lunchBreak.duration || typeof lunchBreak.duration !== 'number' || lunchBreak.duration <= 0) return false;
  
  return true;
};

/**
 * Convert a lunch break object to a TimeRange
 */
export const lunchBreakToTimeRange = (lunchBreak: any): TimeRange | null => {
  if (!isValidLunchBreak(lunchBreak)) return null;
  
  const startMinutes = timeToMinutes(lunchBreak.start_time);
  return {
    start: startMinutes,
    end: startMinutes + lunchBreak.duration
  };
};

/**
 * Core function: Filter out all time slots that overlap with any lunch breaks
 */
export const filterOutLunchBreakOverlaps = (
  timeSlots: string[],
  appointmentDuration: number,
  lunchBreaks: any[]
): string[] => {
  console.log(`============ LUNCH BREAK FILTERING ============`);
  console.log(`Starting with ${timeSlots.length} time slots`);
  console.log(`Filtering against ${lunchBreaks?.length || 0} lunch breaks`);
  
  // Early exit if no lunch breaks or no time slots
  if (!timeSlots || timeSlots.length === 0) {
    console.log(`No time slots to filter, returning empty array`);
    return [];
  }
  
  if (!lunchBreaks || lunchBreaks.length === 0) {
    console.log(`No lunch breaks to filter against, returning all ${timeSlots.length} slots`);
    return timeSlots;
  }
  
  // Get only valid active lunch breaks
  const validLunchBreaks = lunchBreaks.filter(isValidLunchBreak);
  
  if (validLunchBreaks.length === 0) {
    console.log(`No valid active lunch breaks found, returning all ${timeSlots.length} slots`);
    return timeSlots;
  }
  
  // Log all active lunch breaks for debugging
  validLunchBreaks.forEach(breakTime => {
    const start = breakTime.start_time;
    const end = minutesToTime(timeToMinutes(start) + breakTime.duration);
    console.log(`Active lunch break: ${start} to ${end} (${breakTime.duration} minutes)`);
  });
  
  // Convert lunch breaks to TimeRanges for easier comparison
  const lunchBreakRanges = validLunchBreaks
    .map(lunchBreakToTimeRange)
    .filter(range => range !== null) as TimeRange[];
  
  // Filter out slots that overlap with any lunch break
  const filteredSlots = timeSlots.filter(timeSlot => {
    // Convert this time slot to a time range
    const appointmentRange = createTimeRange(timeSlot, appointmentDuration);
    
    // Check against each lunch break range
    for (const lunchBreakRange of lunchBreakRanges) {
      if (doTimeRangesOverlap(appointmentRange, lunchBreakRange)) {
        console.log(`Removing slot ${timeSlot} due to lunch break overlap`);
        return false;
      }
    }
    
    // Keep this slot if it doesn't overlap with any lunch break
    return true;
  });
  
  console.log(`After lunch break filtering: ${filteredSlots.length} of ${timeSlots.length} slots remained`);
  console.log(`============ END LUNCH BREAK FILTERING ============`);
  
  return filteredSlots;
};

/**
 * Debug function: Check if an appointment would overlap with any lunch breaks
 * Returns true if there is an overlap, false otherwise
 */
export const doesAppointmentOverlapLunchBreak = (
  timeSlot: string,
  duration: number,
  lunchBreaks: any[]
): boolean => {
  // Early exit if no valid lunch breaks
  if (!lunchBreaks || !Array.isArray(lunchBreaks) || lunchBreaks.length === 0) {
    return false;
  }
  
  // Validate input parameters
  if (!timeSlot || typeof timeSlot !== 'string' || !duration || typeof duration !== 'number') {
    console.error('Invalid parameters to doesAppointmentOverlapLunchBreak:', 
      { timeSlot, duration, lunchBreaksCount: lunchBreaks.length });
    return false;
  }
  
  // Get only valid lunch breaks
  const validLunchBreaks = lunchBreaks.filter(isValidLunchBreak);
  
  if (validLunchBreaks.length === 0) {
    return false;
  }
  
  // Convert appointment to time range
  const appointmentRange = createTimeRange(timeSlot, duration);
  
  // Check against each lunch break
  for (const lunchBreak of validLunchBreaks) {
    const lunchBreakRange = lunchBreakToTimeRange(lunchBreak);
    if (lunchBreakRange && doTimeRangesOverlap(appointmentRange, lunchBreakRange)) {
      return true;
    }
  }
  
  return false;
};
