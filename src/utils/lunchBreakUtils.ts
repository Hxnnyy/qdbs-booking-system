
/**
 * Lunch Break Utilities
 * 
 * Dedicated utility functions for handling lunch break logic
 */

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
interface TimeRange {
  start: number;
  end: number;
}

/**
 * Checks if two time ranges overlap
 */
export const doTimeRangesOverlap = (range1: TimeRange, range2: TimeRange): boolean => {
  // Four overlap cases:
  // 1. range1 starts during range2
  // 2. range1 ends during range2
  // 3. range1 completely contains range2
  // 4. range1 is completely contained by range2
  
  return (
    (range1.start >= range2.start && range1.start < range2.end) ||
    (range1.end > range2.start && range1.end <= range2.end) ||
    (range1.start <= range2.start && range1.end >= range2.end) ||
    (range1.start >= range2.start && range1.end <= range2.end)
  );
};

/**
 * Checks if a time slot (appointment) overlaps with any lunch breaks
 */
export const doesAppointmentOverlapLunchBreak = (
  timeSlot: string,
  duration: number,
  lunchBreaks: any[]
): boolean => {
  // Early exit if no lunch breaks or invalid parameters
  if (!lunchBreaks || !Array.isArray(lunchBreaks) || lunchBreaks.length === 0) {
    return false;
  }
  
  if (!timeSlot || typeof timeSlot !== 'string' || !duration || typeof duration !== 'number') {
    console.error('Invalid parameters to doesAppointmentOverlapLunchBreak:', 
      { timeSlot, duration, lunchBreaksCount: lunchBreaks.length });
    return false;
  }
  
  // Convert appointment time to minutes
  const appointmentStart = timeToMinutes(timeSlot);
  const appointmentEnd = appointmentStart + duration;
  
  const appointmentRange: TimeRange = {
    start: appointmentStart,
    end: appointmentEnd
  };
  
  console.log(`Checking if appointment ${timeSlot}-${minutesToTime(appointmentEnd)} overlaps with lunch breaks`);
  
  // Check against each active lunch break
  for (const breakTime of lunchBreaks) {
    // Skip inactive lunch breaks
    if (!breakTime.is_active) {
      continue;
    }
    
    // Skip invalid lunch breaks
    if (!breakTime.start_time || typeof breakTime.start_time !== 'string' || 
        !breakTime.duration || typeof breakTime.duration !== 'number') {
      console.warn('Invalid lunch break format:', breakTime);
      continue;
    }
    
    const breakStart = timeToMinutes(breakTime.start_time);
    const breakEnd = breakStart + breakTime.duration;
    
    const breakRange: TimeRange = {
      start: breakStart,
      end: breakEnd
    };
    
    console.log(`Checking against lunch break ${breakTime.start_time}-${minutesToTime(breakEnd)}`);
    
    const overlaps = doTimeRangesOverlap(appointmentRange, breakRange);
    
    if (overlaps) {
      console.log(`Found overlap with lunch break ${breakTime.start_time}-${minutesToTime(breakEnd)}`);
      return true;
    }
  }
  
  return false;
};

/**
 * Filters a list of time slots to remove any that overlap with lunch breaks
 */
export const filterOutLunchBreakOverlaps = (
  timeSlots: string[],
  duration: number,
  lunchBreaks: any[]
): string[] => {
  if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) {
    return [];
  }
  
  // Early return if no lunch breaks
  if (!lunchBreaks || !Array.isArray(lunchBreaks) || lunchBreaks.length === 0) {
    return timeSlots;
  }
  
  // Filter out only active lunch breaks
  const activeLunchBreaks = lunchBreaks.filter(breakTime => breakTime.is_active);
  
  if (activeLunchBreaks.length === 0) {
    console.log('No active lunch breaks found, returning all time slots');
    return timeSlots;
  }
  
  console.log(`Filtering ${timeSlots.length} time slots against ${activeLunchBreaks.length} active lunch breaks`);
  
  // Filter out time slots that overlap with lunch breaks
  const filteredSlots = timeSlots.filter(timeSlot => {
    const overlapsLunchBreak = doesAppointmentOverlapLunchBreak(timeSlot, duration, activeLunchBreaks);
    
    if (overlapsLunchBreak) {
      console.log(`Removing time slot ${timeSlot} due to lunch break overlap`);
    }
    
    return !overlapsLunchBreak;
  });
  
  console.log(`After lunch break filtering: ${filteredSlots.length} of ${timeSlots.length} slots remained`);
  
  return filteredSlots;
};
