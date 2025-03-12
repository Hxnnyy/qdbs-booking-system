import { isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';

// Filter events for calendar view based on date
export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  // Create lunch break events for this specific date
  const eventsForDate = events.map(event => {
    // If it's a lunch break, adjust the date to match the target date
    if (event.status === 'lunch-break') {
      const newStart = new Date(date);
      newStart.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0);
      
      const newEnd = new Date(date);
      newEnd.setHours(event.end.getHours(), event.end.getMinutes(), 0, 0);
      
      return {
        ...event,
        start: newStart,
        end: newEnd
      };
    }
    
    return event;
  });
  
  return eventsForDate.filter(event => isSameDay(event.start, date));
};

// Filter events for a week view
export const filterEventsByWeek = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Week starts on Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  // Create lunch break events for each day of the week
  const allEvents: CalendarEvent[] = [];
  
  events.forEach(event => {
    if (event.status === 'lunch-break') {
      // For lunch breaks, create an event for each day of the week
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + day);
        
        const newStart = new Date(dayDate);
        newStart.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0);
        
        const newEnd = new Date(dayDate);
        newEnd.setHours(event.end.getHours(), event.end.getMinutes(), 0, 0);
        
        allEvents.push({
          ...event,
          id: `${event.id}-${day}`, // Make ID unique for each day
          start: newStart,
          end: newEnd
        });
      }
    } else {
      // Regular bookings
      allEvents.push(event);
    }
  });
  
  return allEvents.filter(event => {
    const eventDate = event.start;
    return eventDate >= weekStart && eventDate <= weekEnd;
  });
};

// Filter events based on a date range
export const filterEventsByDateRange = (events: CalendarEvent[], startDate: Date, endDate: Date): CalendarEvent[] => {
  return events.filter(event => {
    const eventDate = event.start;
    return eventDate >= startDate && eventDate <= endDate;
  });
};
