
import { CalendarEvent } from '@/types/calendar';

/**
 * Extracts holiday events from a list of calendar events for a specific date
 * Since holiday events have been removed, this will return an empty array
 */
export const getHolidayEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  // Add debug logging to understand what's happening
  console.log("getHolidayEventsForDate - Input date:", date);
  console.log("getHolidayEventsForDate - All events:", events.length);
  
  // Since we no longer have holiday status events, return empty array
  return [];
};
