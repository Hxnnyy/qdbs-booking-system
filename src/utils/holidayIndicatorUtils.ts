
import { CalendarEvent } from '@/types/calendar';

/**
 * Extracts holiday events from a list of calendar events for a specific date
 */
export const getHolidayEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  if (!events || events.length === 0) {
    return [];
  }

  // Add debug logging to understand what's happening
  console.log("getHolidayEventsForDate - Input date:", date);
  console.log("getHolidayEventsForDate - All events:", events.length);
  
  const holidayEvents = events.filter(event => {
    const isHoliday = event.status === 'holiday';
    const isAllDay = event.allDay === true;
    
    // Check if the date falls within the holiday period
    // For holiday events, we need to check if the target date is between start and end
    const isDateInHolidayPeriod = isHoliday && (() => {
      const eventStartDate = new Date(event.start);
      eventStartDate.setHours(0, 0, 0, 0);
      
      const eventEndDate = new Date(event.end);
      eventEndDate.setHours(23, 59, 59, 999);
      
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      return targetDate >= eventStartDate && targetDate <= eventEndDate;
    })();
    
    // For debugging
    if (isHoliday) {
      console.log("Found holiday event:", event.title, 
        "Date in holiday period:", isDateInHolidayPeriod,
        "AllDay:", isAllDay,
        "Event start:", new Date(event.start).toISOString(),
        "Event end:", new Date(event.end).toISOString(),
        "Target date:", date.toISOString());
    }
    
    return isHoliday && isAllDay && isDateInHolidayPeriod;
  });
  
  console.log("getHolidayEventsForDate - Filtered holiday events:", holidayEvents.length);
  return holidayEvents;
};

// Function to check if a date is a barber holiday
export const isBarberHolidayDate = (
  allEvents: CalendarEvent[],
  date: Date,
  barberId?: string | null
): boolean => {
  // If we don't have events or a barberId, we can't determine holidays
  if (!allEvents || allEvents.length === 0 || !barberId) return false;
  
  // Filter events to only get holidays for this barber
  const barberEvents = barberId 
    ? allEvents.filter(event => event.barberId === barberId)
    : allEvents;
    
  // Check if there are any holiday events for this date
  const holidayEvents = getHolidayEventsForDate(barberEvents, date);
  
  return holidayEvents.length > 0;
};
