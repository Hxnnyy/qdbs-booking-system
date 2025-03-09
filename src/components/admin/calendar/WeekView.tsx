
import React, { useState, useEffect } from 'react';
import { format, addDays, addHours, startOfWeek, endOfWeek, isToday, getDay, setHours, startOfDay } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { motion } from 'framer-motion';
import { filterEventsByDate } from '@/utils/calendarUtils';

// Constants for time display
const START_HOUR = 8; // 8 AM
const END_HOUR = 20; // 8 PM
const HOURS_TO_DISPLAY = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 100; // Slightly reduced hour height to match DayView

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
  
  // Generate days for the week
  const startDate = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const endDate = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  
  const days = Array.from({ length: 7 }).map((_, index) => {
    const day = addDays(startDate, index);
    return {
      date: day,
      dayName: format(day, 'EEE'),
      dayNumber: format(day, 'd'),
      isToday: isToday(day)
    };
  });
  
  // Apply filtering when events or date changes
  useEffect(() => {
    // Filter events for the entire week by checking each day
    let filtered = filterEventsByDate(events, date, true);
    
    // If a barber is selected, filter by barber ID
    if (selectedBarberId) {
      filtered = filtered.filter(event => event.barberId === selectedBarberId);
    }
    
    setDisplayEvents(filtered);
  }, [events, startDate, endDate, selectedBarberId, date]);

  // Generate time slots for the day (8AM to 8PM)
  const timeSlots = Array.from({ length: HOURS_TO_DISPLAY }).map((_, index) => {
    const slotTime = addHours(setHours(startOfDay(date), START_HOUR), index);
    return {
      time: format(slotTime, 'HH:mm'),
      label: format(slotTime, 'h a')
    };
  });

  const handleDragStart = (event: CalendarEvent) => {
    setDraggingEvent(event);
  };

  const handleDragEnd = (e: React.DragEvent, droppedTime: string, dayIndex: number) => {
    if (!draggingEvent) return;
    
    // Parse the dropped time
    const [hours, minutes] = droppedTime.split(':').map(Number);
    
    // Get the day for the dropped position
    const droppedDay = addDays(startDate, dayIndex);
    
    // Create new start time
    const newStart = new Date(droppedDay);
    newStart.setHours(hours, Math.round(minutes / 15) * 15, 0, 0);
    
    // Calculate new end time based on original duration
    const duration = (draggingEvent.end.getTime() - draggingEvent.start.getTime());
    const newEnd = new Date(newStart.getTime() + duration);
    
    // Call the parent handler with the updated event
    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
  };

  // Calculate position and height for each event within a day column
  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();
    
    // Calculate position from the top (relative to START_HOUR)
    const top = ((startHour - START_HOUR) + (startMinute / 60)) * HOUR_HEIGHT;
    
    // Calculate height based on duration
    const durationHours = (endHour - startHour) + ((endMinute - startMinute) / 60);
    const height = durationHours * HOUR_HEIGHT;
    
    return {
      top: `${top}px`,
      height: `${height}px`
    };
  };

  return (
    <div className="flex h-full min-h-[1200px]">
      {/* Time column */}
      <div className="w-16 flex-shrink-0 border-r border-border bg-background sticky left-0">
        {/* Empty cell for header alignment */}
        <div className="h-12 border-b border-border sticky top-0 z-10 bg-background"></div>
        
        {/* Time slots with better positioned labels */}
        {timeSlots.map((slot) => (
          <div key={slot.time} className="h-[100px] border-b border-border relative">
            <div className="absolute -top-3 left-4 z-10">
              <span className="text-xs text-muted-foreground font-medium">
                {slot.label}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Days columns */}
      <div className="flex-1 flex">
        {days.map((day, dayIndex) => (
          <div key={day.dayName} className="flex-1 flex flex-col min-w-[120px] border-r last:border-r-0 border-border">
            {/* Day header */}
            <div 
              className={`h-12 border-b border-border font-medium flex flex-col items-center justify-center cursor-pointer sticky top-0 z-10 ${
                day.isToday ? 'bg-primary/20' : 'bg-primary/5'
              }`}
              onClick={() => onDateChange(day.date)}
            >
              <div className="text-sm font-semibold">{day.dayName}</div>
              <div className="text-xs font-medium text-primary">{day.dayNumber}</div>
            </div>
            
            {/* Time grid and events */}
            <div 
              className="flex-1 relative"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                // Calculate hours and minutes
                const hours = Math.floor(y / HOUR_HEIGHT) + START_HOUR;
                const rawMinutes = Math.round((y % HOUR_HEIGHT) / HOUR_HEIGHT * 60);
                
                // Snap to 15-minute intervals
                const snappedMinutes = Math.round(rawMinutes / 15) * 15;
                
                // Format the time string
                const droppedTime = `${hours.toString().padStart(2, '0')}:${snappedMinutes.toString().padStart(2, '0')}`;
                handleDragEnd(e, droppedTime, dayIndex);
              }}
            >
              {/* Time grid */}
              {timeSlots.map((slot) => (
                <div 
                  key={slot.time} 
                  className="h-[100px] border-b border-border hover:bg-muted/40 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                >
                  {/* 15-minute markers */}
                  <div className="h-[25px] border-b border-border/20"></div>
                  <div className="h-[25px] border-b border-border/30"></div>
                  <div className="h-[25px] border-b border-border/20"></div>
                </div>
              ))}
              
              {/* Events for this day */}
              {displayEvents
                .filter(event => {
                  const eventDate = new Date(event.start);
                  return getDay(eventDate) === getDay(day.date) &&
                         eventDate.getDate() === day.date.getDate() &&
                         eventDate.getMonth() === day.date.getMonth() &&
                         eventDate.getFullYear() === day.date.getFullYear();
                })
                .map(event => (
                  <div 
                    key={event.id}
                    draggable 
                    onDragStart={() => handleDragStart(event)}
                    className="absolute w-full px-1"
                    style={getEventStyle(event)}
                  >
                    <CalendarEventComponent 
                      event={event} 
                      onEventClick={onEventClick} 
                    />
                  </div>
                ))
              }
              
              {/* Current time indicator */}
              {day.isToday && <CurrentTimeIndicator hourHeight={HOUR_HEIGHT} />}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface CurrentTimeIndicatorProps {
  hourHeight: number;
}

const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({ hourHeight }) => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Only show if within display hours
  if (hours < START_HOUR || hours >= END_HOUR) {
    return null;
  }
  
  const position = (hours - START_HOUR) * hourHeight + (minutes / 60) * hourHeight;
  
  return (
    <motion.div 
      className="absolute w-full h-[2px] bg-red-500 z-20 pointer-events-none"
      style={{ top: `${position}px` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute -left-1 -top-[4px] w-2 h-2 rounded-full bg-red-500" />
    </motion.div>
  );
};
