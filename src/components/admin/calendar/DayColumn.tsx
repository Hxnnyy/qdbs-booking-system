
import React from 'react';
import { CalendarEvent } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { addDays, startOfWeek } from 'date-fns';

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
  return (
    <div 
      className="relative border-r last:border-r-0 border-border"
      style={{ height: `${calendarHeight}px` }}
      onDragOver={(e) => handleDragOver(e, dayIndex)}
      onDrop={handleDragEnd}
    >
      {/* Time grid lines */}
      {Array.from({ length: totalHours }).map((_, hourIndex) => (
        <div 
          key={`grid-${dayIndex}-${hourIndex}`}
          className="h-[60px] border-b border-border"
        />
      ))}

      {/* Events for this day */}
      {processedEvents
        .filter(({ event }) => {
          const eventDate = event.start;
          const columnDate = addDays(startOfWeek(eventDate, { weekStartsOn: 1 }), dayIndex);
          return (
            eventDate.getDate() === columnDate.getDate() &&
            eventDate.getMonth() === columnDate.getMonth() &&
            eventDate.getFullYear() === columnDate.getFullYear()
          );
        })
        .map(({ event, slotIndex, totalSlots }) => {
          const eventHour = event.start.getHours();
          const eventMinute = event.start.getMinutes();
          
          if (eventHour < startHour || eventHour >= startHour + totalHours) return null;
          
          const top = (eventHour - startHour) * 60 + eventMinute;
          const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
          const height = Math.max(durationMinutes, 15);
          
          return (
            <div 
              key={event.id}
              draggable={event.status !== 'lunch-break' && event.status !== 'holiday'}
              onDragStart={() => handleDragStart(event)}
              className="absolute"
              style={{ 
                top: `${top}px`, 
                height: `${height}px`,
                width: '100%',
                padding: 0,
                zIndex: 20
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
  );
};
