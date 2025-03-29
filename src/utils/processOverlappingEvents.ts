
import { CalendarEvent } from "@/types/calendar";

// Process events to handle overlapping time slots with optimized performance
export const processOverlappingEvents = (events: CalendarEvent[]) => {
  if (!events.length) return [];
  
  // First separate day's events (hours:minutes) into timeslots
  const timeslots: Record<string, CalendarEvent[]> = {};
  
  // First pass - organize events into hour-based slots
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    
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
      
      if (!timeslots[key]) {
        timeslots[key] = [];
      }
      
      // Avoid duplicate lunch breaks in the same slot (might happen due to filterEventsByWeek)
      if (event.status === 'lunch-break') {
        let hasExistingLunchBreak = false;
        
        for (let j = 0; j < timeslots[key].length; j++) {
          const existingEvent = timeslots[key][j];
          if (existingEvent.status === 'lunch-break' && existingEvent.barberId === event.barberId) {
            hasExistingLunchBreak = true;
            break;
          }
        }
        
        if (!hasExistingLunchBreak) {
          timeslots[key].push(event);
        }
      } else {
        timeslots[key].push(event);
      }
    }
  }
  
  // Now calculate slot indexes for each event
  const result: { event: CalendarEvent; slotIndex: number; totalSlots: number }[] = [];
  
  // Process each hour slot
  Object.values(timeslots).forEach(slotEvents => {
    // Skip empty slots
    if (slotEvents.length === 0) return;
    
    // Sort events by start time to process them in chronological order
    const sorted = slotEvents.slice().sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Find overlapping events
    const overlappingSets: CalendarEvent[][] = [];
    
    // Group overlapping events
    for (let i = 0; i < sorted.length; i++) {
      const event = sorted[i];
      // Find if this event overlaps with any existing set
      let foundOverlap = false;
      
      for (let j = 0; j < overlappingSets.length; j++) {
        const set = overlappingSets[j];
        // Check if this event overlaps with any event in the set
        let overlapsWithSet = false;
        
        for (let k = 0; k < set.length; k++) {
          const existingEvent = set[k];
          // Check for actual time overlap, not just same hour
          // Two events overlap if one starts before the other ends
          if (
            event.start < existingEvent.end && 
            event.end > existingEvent.start &&
            // Same barber events shouldn't overlap (they should be sequential)
            event.barberId !== existingEvent.barberId
          ) {
            overlapsWithSet = true;
            break;
          }
        }
        
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
    for (let i = 0; i < overlappingSets.length; i++) {
      const set = overlappingSets[i];
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
      const sortedByBarberId = set.slice().sort((a, b) => 
        a.barberId.localeCompare(b.barberId)
      );
      
      // Assign slot indexes within the set
      for (let j = 0; j < sortedByBarberId.length; j++) {
        result.push({
          event: sortedByBarberId[j],
          slotIndex: j,
          totalSlots: sortedByBarberId.length
        });
      }
    }
  });
  
  return result;
};
