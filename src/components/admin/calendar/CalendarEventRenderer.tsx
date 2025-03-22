
import React, { memo } from 'react';
import { CalendarEvent as CalendarEventType } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { processOverlappingEvents } from '@/utils/processOverlappingEvents';
import { format } from 'date-fns';

interface CalendarEventRendererProps {
  events: CalendarEventType[];
  startHour: number;
  onEventClick: (event: CalendarEventType) => void;
  onDragStart: (event: CalendarEventType) => void;
  isDragging: (eventId: string) => boolean;
  date?: Date;
}

export const CalendarEventRenderer: React.FC<CalendarEventRendererProps> = memo(({ 
  events, 
  startHour, 
  onEventClick, 
  onDragStart,
  isDragging,
  date
}) => {
  const processedEvents = processOverlappingEvents(events);

  return (
    <>
      {processedEvents.map(({ event, slotIndex, totalSlots }) => {
        // For week view, check if the event is on the specified date
        if (date) {
          const isSameDate = 
            date.getDate() === event.start.getDate() &&
            date.getMonth() === event.start.getMonth() &&
            date.getFullYear() === event.start.getFullYear();
          
          if (!isSameDate) return null;
        }
        
        const eventHour = event.start.getHours();
        const eventMinute = event.start.getMinutes();
        
        if (eventHour < startHour) return null;
        
        const top = (eventHour - startHour) * 60 + eventMinute;
        const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
        const height = Math.max(durationMinutes, 15);
        
        // Create a truly unique key that includes both the event ID, date and timestamp to prevent duplicates
        const dateStr = date ? format(date, 'yyyy-MM-dd') : 'day-view';
        const uniqueKey = `${event.id}-${dateStr}-${slotIndex}`;
        
        const dragging = isDragging(event.id);
        
        if (dragging) {
          return null; // Don't render if it's currently being dragged
        }
        
        return (
          <div 
            key={uniqueKey}
            draggable={event.status !== 'lunch-break' && event.status !== 'holiday'}
            onDragStart={() => onDragStart(event)}
            className="absolute w-full"
            style={{ 
              top: `${top}px`, 
              height: `${height}px`,
              padding: 0
            }}
          >
            <CalendarEventComponent 
              event={event} 
              onEventClick={onEventClick}
              isDragging={dragging}
              slotIndex={slotIndex}
              totalSlots={totalSlots}
            />
          </div>
        );
      })}
    </>
  );
});

CalendarEventRenderer.displayName = 'CalendarEventRenderer';
