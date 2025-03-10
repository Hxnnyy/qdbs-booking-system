
import React, { useState } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { filterEventsByDate } from '@/utils/calendarUtils';
import { TimeGrid } from './TimeGrid';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';

export const WeekView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const { startHour, endHour } = useCalendarSettings();
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const totalHours = endHour - startHour;
  
  // Define the height of the calendar based on hours range
  const calendarHeight = totalHours * 60; // 60px per hour

  // Calculate the start of the week
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Week starts on Monday
  
  // Generate days for the week (Monday to Sunday)
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    return addDays(weekStart, index);
  });

  const handleDragStart = (event: CalendarEvent) => {
    setDraggingEvent(event);
  };

  const handleDragEnd = (e: React.DragEvent, droppedDay: Date) => {
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    // Calculate time from position
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = totalMinutes % 60;
    
    // Create new start date with the dropped day and time
    const newStart = new Date(droppedDay);
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
      {/* Day headers row */}
      <div className="flex border-b border-border h-12">
        {/* Empty cell for time column alignment */}
        <div className="w-16 border-r border-border"></div>
        
        {/* Day header cells */}
        {weekDays.map((day) => (
          <div 
            key={day.toISOString()} 
            className={`flex-1 font-medium flex flex-col items-center justify-center min-w-[120px] ${
              isToday(day) ? 'bg-primary/10' : ''
            }`}
          >
            <div className="text-sm">{format(day, 'EEE')}</div>
            <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
          </div>
        ))}
      </div>
      
      {/* Time grid and days */}
      <div 
        className="flex-1 relative"
        style={{ height: `${calendarHeight}px` }}
      >
        <div className="flex h-full">
          {weekDays.map((day) => (
            <div 
              key={day.toISOString()}
              className="flex-1 relative border-r border-border min-w-[120px] h-full"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDragEnd(e, day)}
            >
              <TimeGrid date={day}>
                {/* Events for this day */}
                {filterEventsByDate(events, day).map((event) => {
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
          ))}
        </div>
      </div>
    </div>
  );
};
