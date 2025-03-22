
import React from 'react';
import { CalendarEvent as CalendarEventType } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { processOverlappingEvents } from '@/utils/processOverlappingEvents';

interface CalendarEventRendererProps {
  events: CalendarEventType[];
  startHour: number;
  onEventClick: (event: CalendarEventType) => void;
  onDragStart: (event: CalendarEventType) => void;
  isDragging: (eventId: string) => boolean;
  date?: Date;
}

export const CalendarEventRenderer: React.FC<CalendarEventRendererProps> = ({ 
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
        
        return (
          <div 
            key={`${event.id}${date ? `-${date.toISOString().split('T')[0]}` : ''}`}
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
              isDragging={isDragging(event.id)}
              slotIndex={slotIndex}
              totalSlots={totalSlots}
            />
          </div>
        );
      })}
    </>
  );
};
