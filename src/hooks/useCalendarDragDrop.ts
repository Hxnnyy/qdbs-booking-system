
import { useState, useEffect, useRef } from 'react';
import { CalendarEvent, DragPreview } from '@/types/calendar';

export const useCalendarDragDrop = (
  events: CalendarEvent[],
  onEventDrop: (event: CalendarEvent, newStart: Date, newEnd: Date) => void,
  startHour: number
) => {
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  const dragSourceId = useRef<string | null>(null);

  // Initialize display events from props
  useEffect(() => {
    if (!draggingEvent) {
      // Only update display events when not dragging to prevent flicker
      const deepCopiedEvents = events.map(event => ({...event}));
      setDisplayEvents(deepCopiedEvents);
    }
  }, [events, draggingEvent]);

  const handleDragStart = (event: CalendarEvent) => {
    if (event.status === 'lunch-break' || event.status === 'holiday') return;
    
    // Store the ID of the event being dragged
    dragSourceId.current = event.id;
    
    // Create a deep copy of the event to prevent reference issues
    const eventCopy = {...event};
    setDraggingEvent(eventCopy);
    
    // Immediately remove the event from display to prevent duplicates
    setDisplayEvents(prev => prev.filter(e => e.id !== event.id));
  };

  const handleDragOver = (e: React.DragEvent, dayIndex?: number) => {
    e.preventDefault();
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.floor(totalMinutes % 60 / 15) * 15;
    
    const previewTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'pm' : 'am'}`;
    
    setDragPreview({ 
      time: previewTime, 
      top: Math.floor(totalMinutes / 15) * 15,
      columnIndex: dayIndex
    });
  };

  const handleDragEnd = (e: React.DragEvent, date: Date, dayIndex?: number) => {
    if (!draggingEvent || !dragSourceId.current) {
      // Clear states just in case
      setDraggingEvent(null);
      setDragPreview(null);
      dragSourceId.current = null;
      return;
    }
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.floor(totalMinutes % 60 / 15) * 15;
    
    const newStart = new Date(date);
    newStart.setHours(hours, minutes, 0, 0);
    
    const duration = draggingEvent.end.getTime() - draggingEvent.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    console.log('Drop event:', {
      event: draggingEvent.title,
      oldStart: draggingEvent.start.toISOString(),
      newStart: newStart.toISOString(),
      dayIndex
    });
    
    // Make a deep copy of the dragging event
    const eventCopy = {...draggingEvent};
    
    // Clear all drag states immediately to prevent UI issues
    setDraggingEvent(null);
    setDragPreview(null);
    const sourceId = dragSourceId.current;
    dragSourceId.current = null;
    
    // Double-check removal of the event from display events
    setDisplayEvents(prev => prev.filter(e => e.id !== sourceId));
    
    // Let the parent component handle the actual update
    onEventDrop(eventCopy, newStart, newEnd);
  };

  // Handler to cancel drag operation
  const handleDragCancel = () => {
    setDraggingEvent(null);
    setDragPreview(null);
    dragSourceId.current = null;
  };

  return {
    draggingEvent,
    dragPreview,
    displayEvents,
    setDisplayEvents,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    setDragPreview,
    dragSourceId: dragSourceId.current
  };
};
