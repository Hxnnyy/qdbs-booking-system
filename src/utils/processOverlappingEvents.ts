
import { CalendarEvent } from "@/types/calendar";

// Process events to handle overlapping time slots with optimizations
export const processOverlappingEvents = (events: CalendarEvent[]) => {
  if (!events.length) return [];
  
  // Use a Map for better performance in accessing timeslots
  const timeslots = new Map<string, CalendarEvent[]>();
  
  // First pass: Group events by time slots
  for (const event of events) {
    // Skip events with invalid dates
    if (isNaN(event.start.getTime()) || isNaN(event.end.getTime())) {
      console.warn('Event with invalid date found:', event);
      continue;
    }

    // Create a date-specific key so events on different days don't overlap
    const date = event.start.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // For each hour slot that this event covers, add it to that slot
    const startHour = event.start.getHours();
    const endHour = event.end.getHours() + (event.end.getMinutes() > 0 ? 1 : 0);
    
    for (let hour = startHour; hour < endHour; hour++) {
      const key = `${date}-${hour}`;
      
      if (!timeslots.has(key)) {
        timeslots.set(key, []);
      }
      
      const slotEvents = timeslots.get(key)!;
      
      // Avoid duplicate lunch breaks in the same slot (might happen due to filterEventsByWeek)
      if (event.status === 'lunch-break') {
        const existingLunchBreak = slotEvents.find(
          e => e.status === 'lunch-break' && e.barberId === event.barberId
        );
        
        if (!existingLunchBreak) {
          slotEvents.push(event);
        }
      } else {
        slotEvents.push(event);
      }
    }
  }
  
  // Now calculate slot indexes for each event
  const result: { event: CalendarEvent; slotIndex: number; totalSlots: number }[] = [];
  
  // Process each timeslot
  timeslots.forEach(slotEvents => {
    // Sort events by start time for consistent ordering
    const sorted = slotEvents.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Find overlapping events
    const overlappingSets: CalendarEvent[][] = [];
    
    // Group overlapping events
    for (const event of sorted) {
      // Find if this event overlaps with any existing set
      let foundOverlap = false;
      
      for (const set of overlappingSets) {
        // Check if this event overlaps with any event in the set
        const overlapsWithSet = set.some(existingEvent => {
          // Check for actual time overlap, not just same hour
          // Two events overlap if one starts before the other ends
          return (
            event.start < existingEvent.end && 
            event.end > existingEvent.start &&
            // Same barber events shouldn't overlap (they should be sequential)
            event.barberId !== existingEvent.barberId
          );
        });
        
        if (overlapsWithSet) {
          set.push(event);
          foundOverlap = true;
          break;
        }
      }
      
      // If no overlap found, create a new set
      if (!foundOverlap) {
        overlappingSets.push([event]);
      }
    }
    
    // Process each set of overlapping events
    for (const set of overlappingSets) {
      // For single events or non-overlapping events, use full width
      if (set.length === 1) {
        result.push({
          event: set[0],
          slotIndex: 0,
          totalSlots: 1
        });
        continue;
      }
      
      // Sort by barber ID to ensure consistent ordering
      const sortedByBarberId = set.sort((a, b) => 
        a.barberId.localeCompare(b.barberId)
      );
      
      // Assign slot indexes within the set
      sortedByBarberId.forEach((event, index) => {
        result.push({
          event,
          slotIndex: index,
          totalSlots: sortedByBarberId.length
        });
      });
    }
  });
  
  return result;
};
