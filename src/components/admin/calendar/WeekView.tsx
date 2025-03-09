
import React, { useState, useEffect } from 'react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  isToday, 
  isSameDay,
  startOfDay,
  setHours
} from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventCard } from './CalendarEventCard';
import { cn } from '@/lib/utils';
import { filterEventsByWeek } from '@/utils/calendarUtils';

// Constants for time display
const START_HOUR = 8; // 8 AM
const END_HOUR = 20; // 8 PM
const HOURS_TO_DISPLAY = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 80; // Height in pixels for each hour

export const WeekView: React.FC<CalendarViewProps> = ({
  date,
  onDateChange,
  events,
  onEventDrop,
  onEventClick,
  selectedBarberId
}) => {
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  
  // Generate days of the week
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Start week on Monday
  const days = Array.from({ length: 7 }).map((_, index) => {
    const day = addDays(weekStart, index);
    return {
      date: day,
      dayName: format(day, 'EEE'),
      dayNumber: format(day, 'd'),
      isToday: isToday(day)
    };
  });
  
  // Apply filtering when events or date changes
  useEffect(() => {
    let filtered = filterEventsByWeek(events, date);
    
    // If a barber is selected, filter by barber ID
    if (selectedBarberId) {
      filtered = filtered.filter(event => event.barberId === selectedBarberId);
    }
    
    setDisplayEvents(filtered);
  }, [events, date, selectedBarberId]);
  
  // Generate time slots for the day (8AM to 8PM)
  const timeSlots = Array.from({ length: HOURS_TO_DISPLAY + 1 }).map((_, index) => {
    const slotHour = START_HOUR + index;
    const slotTime = setHours(startOfDay(date), slotHour);
    
    return {
      hour: slotHour,
      time: format(slotTime, 'h a'), // e.g., "8 AM"
      timestamp: slotTime
    };
  });
  
  const handleDragStart = (event: CalendarEvent) => {
    setDraggingEvent(event);
  };
  
  const handleDragEnd = (e: React.DragEvent, dayIndex: number, hour: number, minute: number = 0) => {
    if (!draggingEvent) return;
    
    // Get the day for the dropped position
    const droppedDay = addDays(weekStart, dayIndex);
    
    // Create new start date with the dropped day, hour, and minute
    const newStart = new Date(droppedDay);
    newStart.setHours(hour, minute, 0, 0);
    
    // Calculate duration from original event
    const duration = draggingEvent.end.getTime() - draggingEvent.start.getTime();
    
    // Calculate new end time based on original duration
    const newEnd = new Date(newStart.getTime() + duration);
    
    // Call the parent handler with updated event info
    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
  };
  
  // Calculate position and height for an event
  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();
    
    // Calculate position from the top (relative to START_HOUR)
    const top = (startHour - START_HOUR + startMinute / 60) * HOUR_HEIGHT;
    
    // Calculate height based on duration
    const durationHours = (endHour - startHour) + (endMinute - startMinute) / 60;
    const height = durationHours * HOUR_HEIGHT;
    
    return {
      top: `${top}px`,
      height: `${Math.max(height, 40)}px` // Minimum height of 40px
    };
  };

  // Render current time indicator if the date is today
  const CurrentTimeIndicator = ({ dayDate }: { dayDate: Date }) => {
    if (!isToday(dayDate)) return null;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Only show if time is within our display range
    if (currentHour < START_HOUR || currentHour > END_HOUR) return null;
    
    const top = (currentHour - START_HOUR + currentMinute / 60) * HOUR_HEIGHT;
    
    return (
      <div 
        className="absolute w-full h-[2px] bg-red-500 z-10 pointer-events-none"
        style={{ top: `${top}px` }}
      >
        <div className="absolute -left-1 -top-[4px] w-2 h-2 rounded-full bg-red-500" />
      </div>
    );
  };

  return (
    <div 
      className="flex h-full"
      style={{ minHeight: `${(HOURS_TO_DISPLAY + 1) * HOUR_HEIGHT}px` }}
    >
      {/* Time column */}
      <div className="w-20 flex-shrink-0 border-r border-gray-200 bg-gray-50 dark:bg-gray-800 dark:border-gray-700 sticky left-0 z-10">
        {/* Empty cell for header alignment */}
        <div className="h-10 border-b border-gray-200 dark:border-gray-700" />
        
        {/* Time slots */}
        {timeSlots.map((slot) => (
          <div 
            key={slot.hour} 
            className="relative h-20 border-b border-gray-200 dark:border-gray-700"
          >
            <span className="absolute -top-2.5 left-2 text-xs text-gray-500 dark:text-gray-400">
              {slot.time}
            </span>
          </div>
        ))}
      </div>
      
      {/* Days columns */}
      <div className="flex-1 flex min-w-0">
        {days.map((day, dayIndex) => (
          <div 
            key={day.dayName} 
            className="flex-1 flex flex-col min-w-[120px] border-r last:border-r-0 border-gray-200 dark:border-gray-700"
          >
            {/* Day header */}
            <div 
              className={cn(
                "h-10 border-b border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center cursor-pointer",
                day.isToday 
                  ? "bg-blue-50 dark:bg-blue-900/20" 
                  : "bg-gray-50 dark:bg-gray-800"
              )}
              onClick={() => onDateChange(day.date)}
            >
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {day.dayName}
              </div>
              <div className={cn(
                "text-sm font-semibold",
                day.isToday ? "text-blue-600 dark:text-blue-400" : ""
              )}>
                {day.dayNumber}
              </div>
            </div>
            
            {/* Time grid and events */}
            <div 
              className="flex-1 relative"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                
                // Calculate hour and minute based on position
                const rawHour = Math.floor(y / HOUR_HEIGHT) + START_HOUR;
                const rawMinute = Math.round((y % HOUR_HEIGHT) / HOUR_HEIGHT * 60);
                
                // Snap to 15-minute intervals
                const minute = Math.round(rawMinute / 15) * 15;
                const hour = rawHour + (minute === 60 ? 1 : 0);
                const snappedMinute = minute === 60 ? 0 : minute;
                
                handleDragEnd(e, dayIndex, hour, snappedMinute);
              }}
            >
              {/* Time grid */}
              {timeSlots.map((slot) => (
                <div 
                  key={slot.hour} 
                  className="h-20 border-b border-gray-200 dark:border-gray-700 relative"
                >
                  {/* 15-minute markers */}
                  <div className="absolute top-5 w-full border-t border-dashed border-gray-200 dark:border-gray-700 opacity-70" />
                  <div className="absolute top-10 w-full border-t border-dashed border-gray-200 dark:border-gray-700 opacity-70" />
                  <div className="absolute top-15 w-full border-t border-dashed border-gray-200 dark:border-gray-700 opacity-70" />
                </div>
              ))}
              
              {/* Current time indicator */}
              <CurrentTimeIndicator dayDate={day.date} />
              
              {/* Events for this day */}
              {displayEvents
                .filter(event => isSameDay(event.start, day.date))
                .map(event => (
                  <div 
                    key={event.id}
                    draggable
                    onDragStart={() => handleDragStart(event)}
                    className="absolute w-[calc(100%-8px)] mx-1"
                    style={getEventStyle(event)}
                  >
                    <CalendarEventCard event={event} onEventClick={onEventClick} />
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
