
/**
 * Booking Time Utilities
 * 
 * Utility functions for time-based operations related to bookings
 */

/**
 * Determine if a time slot has a conflict with a lunch break
 * 
 * @param timeSlot - Time slot in "HH:MM" format 
 * @param lunchBreaks - Array of lunch break records
 * @param serviceDuration - Duration of the service in minutes
 * @returns Boolean indicating if there's a conflict
 */
export const hasLunchBreakConflict = (
  timeSlot: string,
  lunchBreaks: any[],
  serviceDuration: number
): boolean => {
  if (!lunchBreaks || lunchBreaks.length === 0 || !timeSlot) {
    return false;
  }
  
  const activeLunchBreaks = lunchBreaks.filter(lb => lb.is_active !== false);
  
  if (activeLunchBreaks.length === 0) {
    return false;
  }
  
  // Convert time slot to minutes since midnight
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  // Calculate the end time of the service
  const serviceEndTimeInMinutes = timeInMinutes + serviceDuration;
  
  // Check each lunch break for overlap
  for (const lunchBreak of activeLunchBreaks) {
    const startTimeStr = lunchBreak.start_time || '12:00';
    const duration = lunchBreak.duration || 60;
    
    // Parse the lunch break time
    const [lbHours, lbMinutes] = startTimeStr.split(':').map(Number);
    const lunchStartTimeInMinutes = lbHours * 60 + lbMinutes;
    const lunchEndTimeInMinutes = lunchStartTimeInMinutes + duration;
    
    // Check if there's any overlap between service and lunch break
    // Service starts during lunch, service ends during lunch, or service completely spans lunch
    if (
      (timeInMinutes >= lunchStartTimeInMinutes && timeInMinutes < lunchEndTimeInMinutes) ||
      (serviceEndTimeInMinutes > lunchStartTimeInMinutes && serviceEndTimeInMinutes <= lunchEndTimeInMinutes) ||
      (timeInMinutes <= lunchStartTimeInMinutes && serviceEndTimeInMinutes >= lunchEndTimeInMinutes)
    ) {
      return true;
    }
  }
  
  return false;
};
