
import { CalendarEvent } from "@/types/calendar";

// Process events to handle overlapping time slots
export const processOverlappingEvents = (events: CalendarEvent[]) => {
  if (!events.length) return [];
  
  // First separate day's events (hours:minutes) into timeslots
  const timeslots: Record<string, CalendarEvent[]> = {};
  
  events.forEach(event => {
    // Skip events with invalid dates
    if (isNaN(event.start.getTime()) || isNaN(event.end.getTime())) {
      console.warn('Event with invalid date found:', event);
      return;
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
        const existingLunchBreak = timeslots[key].find(
          e => e.status === 'lunch-break' && e.barberId === event.barberId
        );
        
        if (!existingLunchBreak) {
          timeslots[key].push(event);
        }
      } else {
        timeslots[key].push(event);
      }
    }
  });
  
  // Now calculate slot indexes for each event
  const result: { event: CalendarEvent; slotIndex: number; totalSlots: number }[] = [];
  
  Object.values(timeslots).forEach(slotEvents => {
    // Sort events by start time
    const sorted = [...slotEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Find slots for each event
    const usedSlots: boolean[] = [];
    
    sorted.forEach(event => {
      // Find first available slot index
      let slotIndex = 0;
      while (usedSlots[slotIndex]) {
        slotIndex++;
      }
      
      // Mark this slot as used
      usedSlots[slotIndex] = true;
      
      result.push({
        event,
        slotIndex,
        totalSlots: sorted.length
      });
    });
  });
  
  return result;
};
