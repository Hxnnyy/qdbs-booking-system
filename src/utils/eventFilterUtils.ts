
import { isSameDay, startOfWeek, endOfWeek, addDays, isWithinInterval } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';

// Filter events for calendar view based on date
export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  if (!events || events.length === 0) {
    console.log('No events to filter for day view');
    return [];
  }
  
  console.log(`Filtering ${events.length} events for date: ${date.toISOString().split('T')[0]}`);
  
  // Create lunch break events for this specific date
  const eventsForDate = events.filter(event => {
    // For lunch breaks, check if we already have a lunch break for this date
    if (event.status === 'lunch-break') {
      // Check if this lunch break is already for the correct date
      if (isSameDay(event.start, date)) {
        return true;
      }
      return false;
    }
    
    // For regular events, include if they're on this day
    return isSameDay(event.start, date);
  });
  
  console.log(`Day view filtered ${eventsForDate.length} events from ${events.length} total events`);
  return eventsForDate;
};

// Filter events for a week view
export const filterEventsByWeek = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  if (!events || events.length === 0) {
    console.log('No events to filter for week view');
    return [];
  }
  
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Week starts on Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  console.log(`Filtering events for week: ${weekStart.toISOString()} to ${weekEnd.toISOString()}`);
  
  // Create lunch break events for each day of the week
  const allEvents = events.filter(event => {
    if (event.status === 'lunch-break') {
      // Check if this lunch break is already for a date within this week
      const eventDate = event.start;
      return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
    } else if (event.status === 'holiday') {
      // For holidays, add them if they overlap with the week
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      return (
        isWithinInterval(eventStart, { start: weekStart, end: weekEnd }) ||
        isWithinInterval(eventEnd, { start: weekStart, end: weekEnd }) ||
        (eventStart <= weekStart && eventEnd >= weekEnd)
      );
    } else {
      // Regular bookings - only include if they're within the week bounds
      const eventDate = event.start;
      return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
    }
  });
  
  console.log(`Week view filtered ${allEvents.length} events from ${events.length} total events`);
  return allEvents;
};
