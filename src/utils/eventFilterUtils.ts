
import { isSameDay, startOfWeek, endOfWeek, addDays } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';

// Filter events for calendar view based on date
export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  // Create lunch break events for this specific date
  const eventsForDate = events.flatMap(event => {
    // If it's a lunch break, adjust the date to match the target date
    if (event.status === 'lunch-break') {
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
    return isSameDay(event.start, date) ? [event] : [];
  });
  
  return eventsForDate;
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
    } else {
      // Regular bookings - only include if they're within the week
      const eventDate = event.start;
      if (eventDate >= weekStart && eventDate <= weekEnd) {
        allEvents.push(event);
      }
    }
  });
  
  return allEvents;
};
