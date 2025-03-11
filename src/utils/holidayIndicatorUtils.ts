
import { CalendarEvent } from '@/types/calendar';

/**
 * Extracts holiday events from a list of calendar events for a specific date
 */
export const getHolidayEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  return events.filter(event => 
    event.status === 'holiday' && 
    event.allDay === true &&
    event.start.getDate() === date.getDate() &&
    event.start.getMonth() === date.getMonth() &&
    event.start.getFullYear() === date.getFullYear()
  );
};
