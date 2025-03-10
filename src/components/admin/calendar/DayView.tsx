
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
  const totalHours = endHour - startHour;
  
  // Define the height of the calendar based on hours range
  const calendarHeight = totalHours * 60; // 60px per hour

  // Apply filtering when events or date changes
  useEffect(() => {
    const filtered = filterEventsByDate(events, date);
    setDisplayEvents(filtered);
  }, [events, date]);

  const handleDragStart = (event: CalendarEvent) => {
    setDraggingEvent(event);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    // Calculate time from position with 15-minute snapping
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.round((totalMinutes % 60) / 15) * 15;
    
    // Create the new start date with the same date but updated time
    const newStart = new Date(date);
    newStart.setHours(hours, minutes, 0, 0);
    
    // Calculate original duration to maintain it
    const duration = draggingEvent.end.getTime() - draggingEvent.start.getTime();
    
    // Calculate new end time based on original duration
    const newEnd = new Date(newStart.getTime() + duration);

    // Call the parent handler with the updated event info
    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-md overflow-hidden">
      {/* Day header */}
      <div className={`h-12 border-b border-border font-medium flex flex-col items-center justify-center ${
        isToday(date) ? 'bg-primary/10' : ''
      }`}>
        <div className="text-sm">{format(date, 'EEEE')}</div>
        <div className="text-xs text-muted-foreground">{format(date, 'MMMM d')}</div>
      </div>
      
      {/* Time grid and events */}
      <div 
        className="flex-1 relative"
        style={{ height: `${calendarHeight}px` }}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDragEnd}
      >
        {/* Time column */}
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
        
        {/* Event area */}
        <div className="absolute top-0 left-16 right-0 bottom-0">
          {/* Time grid lines */}
          {Array.from({ length: totalHours + 1 }).map((_, index) => (
            <div 
              key={`grid-${index}`}
              className="absolute w-full h-[60px] border-b border-border"
              style={{ top: `${index * 60}px` }}
            >
              {/* Quarter-hour markers */}
              {index < totalHours && (
                <>
                  <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '15px' }}></div>
                  <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '30px' }}></div>
                  <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '45px' }}></div>
                </>
              )}
            </div>
          ))}
          
          {/* Current time indicator */}
          {isToday(date) && (() => {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            
            // Only show if time is within our visible range
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

          {/* Events */}
          {displayEvents.map((event) => {
            // Calculate position and height based on event times
            const eventStart = event.start;
            const eventEnd = event.end;
            
            // Calculate minutes from startHour for positioning
            const startHour = eventStart.getHours();
            const startMinute = eventStart.getMinutes();
            const endHour = eventEnd.getHours();
            const endMinute = eventEnd.getMinutes();
            
            // Calculate top position and height in pixels
            const startMinutesFromCalendarStart = (startHour - startHour + (startHour - startHour)) * 60 + startMinute;
            const endMinutesFromCalendarStart = (endHour - startHour + (endHour - startHour)) * 60 + endMinute;
            
            // Adjust for events that start before or end after our visible range
            const top = Math.max(0, startMinutesFromCalendarStart);
            const rawHeight = endMinutesFromCalendarStart - startMinutesFromCalendarStart;
            
            // Ensure the event has a minimum height and doesn't extend beyond our view
            const height = Math.min(
              Math.max(rawHeight, 15), // Minimum 15px height
              calendarHeight - top
            );
            
            return (
              <div 
                key={event.id}
                draggable 
                onDragStart={() => handleDragStart(event)}
                className="absolute px-1"
                style={{ 
                  top: `${top}px`, 
                  height: `${height}px`,
                  left: 0,
                  right: 0
                }}
              >
                <CalendarEventComponent 
                  event={event} 
                  onEventClick={onEventClick}
                  isDragging={draggingEvent?.id === event.id}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
