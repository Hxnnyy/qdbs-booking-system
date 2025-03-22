
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const isDraggingRef = useRef<boolean>(false);

  // Initialize display events from props
  useEffect(() => {
    // Only update display events when not dragging to prevent flicker
    if (!isDraggingRef.current) {
      console.log('Updating display events from props, count:', events.length);
      const deepCopiedEvents = events.map(event => ({...event}));
      setDisplayEvents(deepCopiedEvents);
    }
  }, [events]);

  const handleDragStart = useCallback((event: CalendarEvent) => {
    if (event.status === 'lunch-break' || event.status === 'holiday') return;
    
    // Set dragging flag
    isDraggingRef.current = true;
    
    // Store the ID of the event being dragged
    dragSourceId.current = event.id;
    
    // Create a deep copy of the event to prevent reference issues
    const eventCopy = {...event};
    setDraggingEvent(eventCopy);
    
    // Immediately remove the event from display to prevent duplicates
    setDisplayEvents(prev => prev.filter(e => e.id !== event.id));
    
    console.log(`Started dragging event: ${event.id}, removed from display`);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dayIndex?: number) => {
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
  }, [draggingEvent, startHour]);

  const handleDragEnd = useCallback((e: React.DragEvent, date: Date, dayIndex?: number) => {
    console.log('Drag end triggered');
    
    if (!draggingEvent || !dragSourceId.current) {
      // Clear states just in case
      setDraggingEvent(null);
      setDragPreview(null);
      dragSourceId.current = null;
      isDraggingRef.current = false;
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
    isDraggingRef.current = false;
    
    // Double-check removal of the event from display events
    setDisplayEvents(prev => prev.filter(e => e.id !== sourceId));
    
    // Let the parent component handle the actual update
    onEventDrop(eventCopy, newStart, newEnd);
  }, [draggingEvent, onEventDrop, startHour]);

  // Handler to cancel drag operation
  const handleDragCancel = useCallback(() => {
    console.log('Drag cancelled, cleaning up');
    setDraggingEvent(null);
    setDragPreview(null);
    dragSourceId.current = null;
    isDraggingRef.current = false;
    
    // Force refresh display events from main events prop
    const deepCopiedEvents = events.map(event => ({...event}));
    setDisplayEvents(deepCopiedEvents);
  }, [events]);

  // Global drag end handler to ensure cleanup even if drop happens outside calendar
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      if (isDraggingRef.current) {
        console.log('Global drag end detected, cleaning up');
        handleDragCancel();
      }
    };

    document.addEventListener('dragend', handleGlobalDragEnd);
    
    return () => {
      document.removeEventListener('dragend', handleGlobalDragEnd);
    };
  }, [handleDragCancel]);

  const isEventDragging = useCallback((eventId: string) => {
    return dragSourceId.current === eventId;
  }, []);

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
    dragSourceId: dragSourceId.current,
    isEventDragging
  };
};
