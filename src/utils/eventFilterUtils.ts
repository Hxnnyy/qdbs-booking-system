
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
  
  const filteredEvents = [];
  
  // Process regular events
  const regularEvents = events.filter(event => event.status !== 'lunch-break');
  regularEvents.forEach(event => {
    if (event.status === 'holiday') {
      // For holidays, add them if they overlap with the week
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      if (
        isWithinInterval(eventStart, { start: weekStart, end: weekEnd }) ||
        isWithinInterval(eventEnd, { start: weekStart, end: weekEnd }) ||
        (eventStart <= weekStart && eventEnd >= weekEnd)
      ) {
        filteredEvents.push(event);
      }
    } else {
      // Regular bookings - only include if they're within the week bounds
      const eventDate = event.start;
      if (isWithinInterval(eventDate, { start: weekStart, end: weekEnd })) {
        filteredEvents.push(event);
      }
    }
  });
  
  // Process lunch breaks - create a copy for each day of the week
  const lunchBreaks = events.filter(event => event.status === 'lunch-break');
  
  lunchBreaks.forEach(lunchBreak => {
    // For each lunch break, create a copy for each day of the week
    for (let i = 0; i < 7; i++) {
      const dayDate = addDays(weekStart, i);
      
      // Create a new lunch break event for this day
      const dayLunchBreak = {
        ...lunchBreak,
        start: new Date(dayDate),
        end: new Date(dayDate)
      };
      
      // Set the correct time from the original lunch break
      dayLunchBreak.start.setHours(
        lunchBreak.start.getHours(),
        lunchBreak.start.getMinutes(),
        0,
        0
      );
      
      dayLunchBreak.end.setHours(
        lunchBreak.end.getHours(),
        lunchBreak.end.getMinutes(),
        0,
        0
      );
      
      // Add this lunch break to the filtered events
      filteredEvents.push(dayLunchBreak);
    }
  });
  
  console.log(`Week view filtered ${filteredEvents.length} events for week view`);
  return filteredEvents;
};
