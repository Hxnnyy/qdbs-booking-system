
import { useState, useEffect } from 'react';
import { CalendarEvent, DragPreview } from '@/types/calendar';

export const useCalendarDragDrop = (
  events: CalendarEvent[],
  onEventDrop: (event: CalendarEvent, newStart: Date, newEnd: Date) => void,
  startHour: number
) => {
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    setDisplayEvents(events);
  }, [events]);

  const handleDragStart = (event: CalendarEvent) => {
    if (event.status === 'lunch-break' || event.status === 'holiday') return;
    // Create a deep copy of the event to prevent reference issues
    setDraggingEvent({...event});
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
    if (!draggingEvent) return;
    
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

    // Store the event ID before clearing dragging state
    const eventId = draggingEvent.id;
    
    // Clear drag states immediately to prevent UI issues
    setDraggingEvent(null);
    setDragPreview(null);
    
    // Remove the event from display events immediately to prevent duplication
    setDisplayEvents(prev => prev.filter(e => e.id !== eventId));
    
    // Call the actual event handler
    onEventDrop(draggingEvent, newStart, newEnd);
  };

  return {
    draggingEvent,
    dragPreview,
    displayEvents,
    setDisplayEvents,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    setDragPreview
  };
};
