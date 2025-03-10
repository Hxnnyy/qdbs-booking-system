
import React, { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { filterEventsByDate } from '@/utils/calendarUtils';
import { TimeGrid } from './TimeGrid';
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
    
    // Calculate time from position
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = totalMinutes % 60;
    
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
        <TimeGrid date={date}>
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
            const startMinutesFromCalendarStart = (startHour - startHour) * 60 + startMinute;
            const endMinutesFromCalendarStart = (endHour - startHour) * 60 + endMinute;
            
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
        </TimeGrid>
      </div>
    </div>
  );
};
