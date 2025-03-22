
import { CalendarEvent } from '@/types/calendar';

// Helper function to check if two time ranges overlap
const doEventsOverlap = (event1: CalendarEvent, event2: CalendarEvent) => {
  return event1.start < event2.end && event2.start < event1.end;
};

// Function to generate a unique key for each time slot
const generateGroupKey = (event: CalendarEvent) => {
  return `${event.start.getTime()}-${event.end.getTime()}`;
};

export const processOverlappingEvents = (events: CalendarEvent[]) => {
  // Separate holidays from other events
  const holidays = events.filter(event => event.status === 'holiday');
  const nonHolidayEvents = events.filter(event => event.status !== 'holiday');
  
  // Filter out duplicate lunch breaks
  // This ensures lunch breaks with the same barber and time are only shown once
  const uniqueLunchBreaks = new Map();
  nonHolidayEvents.forEach(event => {
    if (event.status === 'lunch-break') {
      const key = `${event.barberId}-${event.start.getHours()}:${event.start.getMinutes()}-${event.end.getHours()}:${event.end.getMinutes()}`;
      uniqueLunchBreaks.set(key, event);
    }
  });
  
  // Create a new array with unique lunch breaks and other events
  const uniqueEvents = nonHolidayEvents.filter(event => event.status !== 'lunch-break')
    .concat(Array.from(uniqueLunchBreaks.values()));
  
  // Sort events by start time to ensure consistent processing
  uniqueEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
  
  // Create a map to track overlapping events
  const overlappingGroups: Map<string, { appointments: CalendarEvent[], lunchBreaks: CalendarEvent[] }> = new Map();
  
  // Group overlapping events
  uniqueEvents.forEach(event => {
    let foundGroup = false;
    
    // Check existing groups for overlap
    for (const [groupKey, group] of overlappingGroups.entries()) {
      // Check if this event overlaps with any event in the existing group
      const hasOverlap = [...group.appointments, ...group.lunchBreaks].some(
        existingEvent => doEventsOverlap(event, existingEvent)
      );
      
      if (hasOverlap) {
        // Add to existing group based on event type
        if (event.status === 'lunch-break') {
          group.lunchBreaks.push(event);
        } else {
          group.appointments.push(event);
        }
        foundGroup = true;
        break;
      }
    }
    
    // If no overlap found, create new group
    if (!foundGroup) {
      const groupKey = generateGroupKey(event);
      overlappingGroups.set(groupKey, {
        appointments: event.status === 'lunch-break' ? [] : [event],
        lunchBreaks: event.status === 'lunch-break' ? [event] : []
      });
    }
  });
  
  const results: Array<{event: CalendarEvent, slotIndex: number, totalSlots: number}> = [];
  
  // Process each group
  overlappingGroups.forEach(group => {
    // Sort lunch breaks by start time for consistent display
    group.lunchBreaks.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    const totalSlots = Math.max(1, group.appointments.length + group.lunchBreaks.length);
    
    // Add appointments first (they'll be on the left)
    group.appointments.forEach((event, index) => {
      results.push({
        event,
        slotIndex: index,
        totalSlots
      });
    });
    
    // Add lunch breaks right after appointments with contiguous slot indices
    const appointmentCount = group.appointments.length;
    group.lunchBreaks.forEach((event, index) => {
      results.push({
        event,
        slotIndex: appointmentCount + index,
        totalSlots
      });
    });
  });
  
  // Add holidays (full width)
  holidays.forEach(holidayEvent => {
    results.push({
      event: holidayEvent,
      slotIndex: 0,
      totalSlots: 1
    });
  });
  
  return results;
};
