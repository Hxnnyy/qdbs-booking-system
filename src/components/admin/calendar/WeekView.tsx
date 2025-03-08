
import React, { useState, useEffect } from 'react';
import { format, addHours, startOfDay, addDays, startOfWeek, endOfWeek, isSameDay, setHours } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { motion } from 'framer-motion';
import { filterEventsByDate } from '@/utils/calendarUtils';

// Constants for time display
const START_HOUR = 8; // 8 AM
const END_HOUR = 20; // 8 PM
const HOURS_TO_DISPLAY = END_HOUR - START_HOUR;

export const WeekView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick,
  selectedBarberId
}) => {
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);

  // Calculate the start and end of the week
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Week starts on Monday
  
  // Generate days for the week
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    return addDays(weekStart, index);
  });

  // Filter events when barber selection changes
  useEffect(() => {
    if (selectedBarberId) {
      setFilteredEvents(events.filter(event => event.barberId === selectedBarberId));
    } else {
      setFilteredEvents(events);
    }
  }, [events, selectedBarberId]);

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

  const handleDragEnd = (e: React.DragEvent, droppedDay: Date, droppedTime: string) => {
    if (!draggingEvent) return;
    
    // Parse the dropped time
    const [hours, minutes] = droppedTime.split(':').map(Number);
    
    // Snap minutes to 15-minute intervals (0, 15, 30, 45)
    const snappedMinutes = Math.round(minutes / 15) * 15;
    const newStart = new Date(droppedDay);
    newStart.setHours(hours, snappedMinutes, 0, 0);
    
    // Calculate new end time based on original duration
    const duration = (draggingEvent.end.getTime() - draggingEvent.start.getTime());
    const newEnd = new Date(newStart.getTime() + duration);

    // Call the parent handler with the updated event info
    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
  };

  return (
    <div className="flex h-[840px] relative border border-border rounded-md overflow-hidden bg-white">
      {/* Time column */}
      <div className="w-20 flex-shrink-0 border-r border-border bg-background">
        {/* Empty cell for header alignment */}
        <div className="h-12 border-b border-border"></div>
        
        {timeSlots.map((slot) => (
          <div key={slot.time} className="h-[60px] border-b border-border flex items-start pl-2 pt-1">
            <span className="text-xs text-muted-foreground">{slot.label}</span>
          </div>
        ))}
      </div>
      
      {/* Days columns */}
      <div className="flex-1 flex">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="flex-1 flex flex-col min-w-[120px] max-w-[1fr]">
            {/* Day header */}
            <div 
              className={`h-12 border-b border-r border-border font-medium flex flex-col items-center justify-center ${
                isSameDay(day, new Date()) ? 'bg-primary/10' : ''
              }`}
            >
              <div className="text-sm">{format(day, 'EEE')}</div>
              <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
            </div>
            
            {/* Time slots for the day */}
            <div 
              className="flex-1 relative border-r border-border"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
                // Calculate hours and raw minutes
                const hours = Math.floor(y / 60) + START_HOUR;
                const rawMinutes = Math.round((y % 60) / 60 * 60);
                
                // Snap to 15-minute intervals
                const snappedMinutes = Math.round(rawMinutes / 15) * 15;
                
                // Format the time string
                const droppedTime = `${hours.toString().padStart(2, '0')}:${snappedMinutes.toString().padStart(2, '0')}`;
                handleDragEnd(e, day, droppedTime);
              }}
            >
              {/* Time grid lines */}
              {timeSlots.map((slot) => (
                <div 
                  key={slot.time} 
                  className="h-[60px] border-b border-border hover:bg-muted/40 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                >
                  {/* 15-minute markers */}
                  <div className="h-[15px] border-b border-border/20"></div>
                  <div className="h-[15px] border-b border-border/30"></div>
                  <div className="h-[15px] border-b border-border/20"></div>
                </div>
              ))}
              
              {/* Events for this day */}
              {filterEventsByDate(filteredEvents, day).map((event) => (
                <div 
                  key={event.id}
                  draggable 
                  onDragStart={() => handleDragStart(event)}
                  className="absolute w-full"
                  style={{ top: 0, left: 0, right: 0 }}
                >
                  <CalendarEventComponent 
                    event={event} 
                    onEventClick={onEventClick} 
                  />
                </div>
              ))}
              
              {/* Current time indicator */}
              {isSameDay(day, new Date()) && (
                <CurrentTimeIndicator />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CurrentTimeIndicator: React.FC = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Only show if within display hours
  if (hours < START_HOUR || hours >= END_HOUR) {
    return null;
  }
  
  const position = (hours - START_HOUR) * 60 + minutes;
  
  return (
    <motion.div 
      className="absolute w-full h-[2px] bg-red-500 z-20 pointer-events-none"
      style={{ top: `${position}px` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute -left-1 -top-[4px] w-2 h-2 rounded-full bg-red-500" />
    </motion.div>
  );
};
