
import { CalendarEvent } from '@/types/calendar';

/**
 * This function used to extract holiday events from a list of calendar events for a specific date
 * Since holiday events have been removed, this will return an empty array
 */
export const getHolidayEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  // Since we no longer have holiday status events, return empty array
  return [];
};
