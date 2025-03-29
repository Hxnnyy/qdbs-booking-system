
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
  const eventsForDate = events.flatMap(event => {
    // If it's a lunch break, adjust the date to match the target date
    if (event.status === 'lunch-break') {
      console.log(`Processing lunch break: ${event.title} for ${event.barber}`);
      const newStart = new Date(date);
      newStart.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0);
      
      const newEnd = new Date(date);
      newEnd.setHours(event.end.getHours(), event.end.getMinutes(), 0, 0);
      
      return {
        ...event,
        id: `${event.id}-${date.toISOString().split('T')[0]}`, // Make ID unique for this day
        start: newStart,
        end: newEnd
      };
    }
    
    // For regular events, include if they're on this day
    if (isSameDay(event.start, date)) {
      console.log(`Including event in day view: ${event.title} on ${event.start.toISOString()}`);
      return [event];
    } else {
      return [];
    }
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
  const allEvents: CalendarEvent[] = [];
  
  events.forEach(event => {
    if (event.status === 'lunch-break') {
      console.log(`Processing lunch break for week view: ${event.title} for ${event.barber}`);
      // For lunch breaks, create an event for each day of the week
      for (let day = 0; day < 7; day++) {
        const dayDate = addDays(weekStart, day);
        
        const newStart = new Date(dayDate);
        newStart.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0);
        
        const newEnd = new Date(dayDate);
        newEnd.setHours(event.end.getHours(), event.end.getMinutes(), 0, 0);
        
        allEvents.push({
          ...event,
          id: `${event.id}-${dayDate.toISOString().split('T')[0]}`, // Make ID unique for each day
          start: newStart,
          end: newEnd
        });
      }
    } else if (event.status === 'holiday') {
      // For holidays, add them if they overlap with the week
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end);
      
      if (
        isWithinInterval(eventStart, { start: weekStart, end: weekEnd }) ||
        isWithinInterval(eventEnd, { start: weekStart, end: weekEnd }) ||
        (eventStart <= weekStart && eventEnd >= weekEnd)
      ) {
        console.log(`Including holiday in week view: ${event.title} (${event.start.toISOString()} - ${event.end.toISOString()})`);
        allEvents.push(event);
      }
    } else {
      // Regular bookings - only include if they're within the week
      const eventDate = event.start;
      
      // Check if the event is within the week bounds
      const isInWeek = isWithinInterval(eventDate, { 
        start: weekStart, 
        end: weekEnd 
      });
      
      if (isInWeek) {
        console.log(`Including event in week view: ${event.title} on ${eventDate.toISOString()}`);
        allEvents.push(event);
      }
    }
  });
  
  console.log(`Week view filtered ${allEvents.length} events from ${events.length} total events`);
  return allEvents;
};
