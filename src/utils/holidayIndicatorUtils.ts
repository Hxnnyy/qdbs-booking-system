
import { CalendarEvent } from '@/types/calendar';

/**
 * Extracts holiday events from a list of calendar events for a specific date
 */
export const getHolidayEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  // Add debug logging to understand what's happening
  console.log("getHolidayEventsForDate - Input date:", date);
  console.log("getHolidayEventsForDate - All events:", events.length);
  
  const holidayEvents = events.filter(event => {
    const isHoliday = event.status === 'holiday';
    const isAllDay = event.allDay === true;
    const isSameDate = 
      event.start.getDate() === date.getDate() &&
      event.start.getMonth() === date.getMonth() &&
      event.start.getFullYear() === date.getFullYear();
    
    // For debugging
    if (isHoliday) {
      console.log("Found holiday event:", event.title, 
        "Date match:", isSameDate, 
        "AllDay:", isAllDay,
        "Event date:", event.start.toISOString(),
        "Target date:", date.toISOString());
    }
    
    return isHoliday && isAllDay && isSameDate;
  });
  
  console.log("getHolidayEventsForDate - Filtered holiday events:", holidayEvents.length);
  return holidayEvents;
};
