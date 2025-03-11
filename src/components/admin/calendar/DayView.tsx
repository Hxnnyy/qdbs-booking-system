import React, { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
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

  const processOverlappingEvents = (events: CalendarEvent[]) => {
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
    
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
    
    return results;
  };

  useEffect(() => {
    const filtered = filterEventsByDate(events, date);
    setDisplayEvents(filtered);
  }, [events, date]);

  const handleDragStart = (event: CalendarEvent) => {
    if (event.status === 'lunch-break') return;
    setDraggingEvent(event);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.floor(totalMinutes % 60 / 15) * 15;
    
    const previewTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'pm' : 'am'}`;
    setDragPreview({ time: previewTime, top: Math.floor(totalMinutes / 15) * 15 });
  };

  const handleDragEnd = (e: React.DragEvent) => {
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

    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
    setDragPreview(null);
  };

  const processedEvents = processOverlappingEvents(displayEvents);

  return (
    <div className="flex flex-col h-full border border-border rounded-md overflow-hidden bg-background">
      {displayEvents.some(event => event.status === 'holiday') && (
        <div className="bg-red-100 px-4 py-2 text-sm text-red-800 border-b border-red-200">
          {displayEvents
            .filter(event => event.status === 'holiday')
            .map(event => (
              <div key={event.id}>
                {event.barber} on Holiday: {event.title}
              </div>
            ))}
        </div>
      )}
      
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

          {processedEvents.map(({ event, slotIndex, totalSlots }) => {
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
        
        {dragPreview && (
          <div 
            className="absolute left-16 right-0 pointer-events-none z-50"
            style={{ top: `${dragPreview.top}px` }}
          >
            <div className="bg-primary/70 border-2 border-primary text-white font-medium rounded px-3 py-1.5 text-sm inline-block shadow-md">
              Drop to schedule at {dragPreview.time}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
