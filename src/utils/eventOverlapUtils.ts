
import { CalendarEvent } from '@/types/calendar';

// Process events to handle overlapping appointments
export const processOverlappingEvents = (events: CalendarEvent[]) => {
  // First, separate lunch breaks from other events
  const lunchBreaks = events.filter(event => event.status === 'lunch-break');
  const otherEvents = events.filter(event => event.status !== 'lunch-break');
  
  // Process regular events (non-lunch-breaks)
  const sortedEvents = [...otherEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
  
  const overlappingGroups: CalendarEvent[][] = [];
  
  sortedEvents.forEach(event => {
    const overlappingGroupIndex = overlappingGroups.findIndex(group => 
      group.some(existingEvent => {
        return (
          (event.start < existingEvent.end && event.end > existingEvent.start) || 
          (existingEvent.start < event.end && existingEvent.end > event.start)
        );
      })
    );
    
    if (overlappingGroupIndex >= 0) {
      overlappingGroups[overlappingGroupIndex].push(event);
    } else {
      overlappingGroups.push([event]);
    }
  });
  
  const results: Array<{event: CalendarEvent, slotIndex: number, totalSlots: number}> = [];
  
  overlappingGroups.forEach(group => {
    const barberGroups: Record<string, CalendarEvent[]> = {};
    
    group.forEach(event => {
      if (!barberGroups[event.barberId]) {
        barberGroups[event.barberId] = [];
      }
      barberGroups[event.barberId].push(event);
    });
    
    if (Object.keys(barberGroups).length > 1) {
      let slotOffset = 0;
      
      Object.values(barberGroups).forEach(barberGroup => {
        const sortedBarberGroup = barberGroup.sort((a, b) => a.start.getTime() - b.start.getTime());
        const barberTotalSlots = group.length;
        
        sortedBarberGroup.forEach((event, index) => {
          results.push({
            event,
            slotIndex: slotOffset + index,
            totalSlots: barberTotalSlots
          });
        });
        
        slotOffset += barberGroup.length;
      });
    } else {
      const sortedGroup = group.sort((a, b) => a.start.getTime() - b.start.getTime());
      const totalSlots = sortedGroup.length;
      
      sortedGroup.forEach((event, index) => {
        results.push({
          event,
          slotIndex: index,
          totalSlots
        });
      });
    }
  });
  
  // Process lunch breaks separately - always give them full width regardless of any holiday
  lunchBreaks.forEach(lunchEvent => {
    results.push({
      event: lunchEvent,
      slotIndex: 0, 
      totalSlots: 1  // Always use full width for lunch breaks
    });
  });
  
  return results;
};
