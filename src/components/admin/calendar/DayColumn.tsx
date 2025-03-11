
import React from 'react';
import { CalendarEvent } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { DayColumnGrid } from './DayColumnGrid';

interface DayColumnProps {
  dayIndex: number;
  startHour: number;
  totalHours: number;
  processedEvents: Array<{event: CalendarEvent, slotIndex: number, totalSlots: number}>;
  handleDragOver: (e: React.DragEvent, dayIndex: number) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  handleDragStart: (event: CalendarEvent) => void;
  draggingEvent: CalendarEvent | null;
  calendarHeight: number;
  onEventClick: (event: CalendarEvent) => void;
}

export const DayColumn: React.FC<DayColumnProps> = ({ 
  dayIndex,
  startHour,
  totalHours,
  processedEvents,
  handleDragOver,
  handleDragEnd,
  handleDragStart,
  draggingEvent,
  calendarHeight,
  onEventClick
}) => {
  // Calculate endHour from startHour and totalHours
  const endHour = startHour + totalHours;
  
  return (
    <div 
      className="relative border-r last:border-r-0 border-border"
      style={{ height: `${calendarHeight}px` }}
      onDragOver={(e) => handleDragOver(e, dayIndex)}
      onDrop={handleDragEnd}
      onDragLeave={() => {}} // This will be handled in the parent component
    >
      <DayColumnGrid totalHours={totalHours} />
      
      <div className="absolute top-0 left-16 right-0 bottom-0">
        {processedEvents.map(({ event, slotIndex, totalSlots }) => {
          const eventDay = event.start.getDay();
          if (dayIndex !== eventDay) return null;
          
          const eventHour = event.start.getHours();
          const eventMinute = event.start.getMinutes();
          
          if (eventHour < startHour || eventHour >= endHour) return null;
          
          const top = (eventHour - startHour) * 60 + eventMinute;
          const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
          const height = Math.max(durationMinutes, 15);
          
          return (
            <div 
              key={event.id}
              draggable={event.status !== 'lunch-break'}
              onDragStart={() => handleDragStart(event)}
              className="absolute w-full"
              style={{ 
                top: `${top}px`, 
                height: `${height}px`,
                padding: 0 // Remove any padding that might be creating gaps
              }}
            >
              <CalendarEventComponent 
                event={event} 
                onEventClick={onEventClick}
                isDragging={draggingEvent?.id === event.id}
                slotIndex={slotIndex}
                totalSlots={totalSlots}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
