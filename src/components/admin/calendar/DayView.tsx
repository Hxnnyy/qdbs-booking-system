import React, { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { filterEventsByDate } from '@/utils/calendarUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';

export const DayView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const { startHour, endHour } = useCalendarSettings();
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  const [dragPreview, setDragPreview] = useState<{ time: string, top: number } | null>(null);
  const totalHours = endHour - startHour;
  
  const calendarHeight = totalHours * 60;

  const organizeOverlappingEvents = (events: CalendarEvent[]) => {
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
    const slots: { [key: string]: CalendarEvent[][] } = {};

    sortedEvents.forEach(event => {
      const eventHour = event.start.getHours();
      const eventMinute = event.start.getMinutes();
      const timeKey = `${eventHour}:${eventMinute}`;

      if (!slots[timeKey]) {
        slots[timeKey] = [[]];
      }

      let placed = false;
      for (let slotGroup of slots[timeKey]) {
        if (!slotGroup.some(existingEvent => {
          const eventEnd = event.end.getTime();
          const existingEnd = existingEvent.end.getTime();
          return event.start.getTime() < existingEnd && eventEnd > existingEvent.start.getTime();
        })) {
          slotGroup.push(event);
          placed = true;
          break;
        }
      }

      if (!placed) {
        slots[timeKey].push([event]);
      }
    });

    return slots;
  };

  useEffect(() => {
    const filtered = filterEventsByDate(events, date);
    const organized = organizeOverlappingEvents(filtered);
    setDisplayEvents(filtered);
  }, [events, date]);

  const handleDragStart = (event: CalendarEvent) => {
    setDraggingEvent(event);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.round((totalMinutes % 60) / 15) * 15;
    
    const previewTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'pm' : 'am'}`;
    setDragPreview({ time: previewTime, top: y });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.round((totalMinutes % 60) / 15) * 15;
    
    const newStart = new Date(date);
    newStart.setHours(hours, minutes, 0, 0);
    
    const duration = draggingEvent.end.getTime() - draggingEvent.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
    setDragPreview(null);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-md overflow-hidden">
      <div className={`h-12 border-b border-border font-medium flex flex-col items-center justify-center ${
        isToday(date) ? 'bg-primary/10' : ''
      }`}>
        <div className="text-sm">{format(date, 'EEEE')}</div>
        <div className="text-xs text-muted-foreground">{format(date, 'MMMM d')}</div>
      </div>
      
      <div 
        className="flex-1 relative"
        style={{ height: `${calendarHeight}px` }}
        onDragOver={handleDragOver}
        onDrop={handleDragEnd}
        onDragLeave={() => setDragPreview(null)}
      >
        <div className="absolute top-0 left-0 bottom-0 w-16 z-10 border-r border-border bg-background">
          {Array.from({ length: totalHours + 1 }).map((_, index) => {
            const hour = startHour + index;
            return (
              <div 
                key={`time-${hour}`}
                className="h-[60px] flex items-center justify-end pr-2 text-xs text-muted-foreground"
              >
                {hour % 12 === 0 ? '12' : hour % 12}{hour < 12 ? 'am' : 'pm'}
              </div>
            );
          })}
        </div>
        
        <div className="absolute top-0 left-16 right-0 bottom-0">
          {Array.from({ length: totalHours + 1 }).map((_, index) => (
            <div 
              key={`grid-${index}`}
              className="absolute w-full h-[60px] border-b border-border"
              style={{ top: `${index * 60}px` }}
            >
              {index < totalHours && (
                <>
                  <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '15px' }}></div>
                  <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '30px' }}></div>
                  <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '45px' }}></div>
                </>
              )}
            </div>
          ))}
          
          {isToday(date) && (() => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            
            if (hours < startHour || hours >= endHour) return null;
            
            const position = (hours - startHour) * 60 + minutes;
            
            return (
              <div 
                className="absolute left-0 right-0 h-[2px] bg-red-500 z-20 pointer-events-none"
                style={{ top: `${position}px` }}
              >
                <div className="absolute -left-1 -top-[4px] w-2 h-2 rounded-full bg-red-500" />
              </div>
            );
          })()}

          {displayEvents.map((event) => {
            const eventHour = event.start.getHours();
            const eventMinute = event.start.getMinutes();
            const timeKey = `${eventHour}:${eventMinute}`;
            
            if (eventHour < startHour || eventHour >= endHour) return null;
            
            const top = (eventHour - startHour) * 60 + eventMinute;
            const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
            const height = Math.max(durationMinutes, 15);

            let slotIndex = 0;
            let totalSlots = 1;
            const overlappingEvents = displayEvents.filter(e => {
              const eventEnd = event.end.getTime();
              const eEnd = e.end.getTime();
              return event.start.getTime() < eEnd && eventEnd > e.start.getTime();
            });
            
            if (overlappingEvents.length > 1) {
              slotIndex = overlappingEvents.indexOf(event);
              totalSlots = overlappingEvents.length;
            }
            
            return (
              <div 
                key={event.id}
                draggable 
                onDragStart={() => handleDragStart(event)}
                className="absolute w-full"
                style={{ 
                  top: `${top}px`, 
                  height: `${height}px`,
                  paddingLeft: '16px',
                  paddingRight: '4px'
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
        
        {dragPreview && (
          <div 
            className="absolute left-16 right-0 pointer-events-none"
            style={{ top: `${dragPreview.top}px` }}
          >
            <div className="bg-primary/20 border border-primary rounded px-2 py-1 text-xs inline-block">
              Drop to schedule at {dragPreview.time}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
