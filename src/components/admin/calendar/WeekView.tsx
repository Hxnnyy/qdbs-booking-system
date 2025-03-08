
import React, { useState } from 'react';
import { format, addHours, startOfDay, addDays, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { motion } from 'framer-motion';
import { filterEventsByDate, getBarberColor } from '@/utils/calendarUtils';

export const WeekView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);

  // Calculate the start and end of the week
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Week starts on Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  // Generate days for the week
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    return addDays(weekStart, index);
  });

  // Generate time slots for the day (24 hours)
  const timeSlots = Array.from({ length: 24 }).map((_, index) => {
    const slotTime = addHours(startOfDay(date), index);
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
    const newStart = new Date(droppedDay);
    newStart.setHours(hours, minutes, 0, 0);
    
    // Calculate new end time based on original duration
    const duration = (draggingEvent.end.getTime() - draggingEvent.start.getTime());
    const newEnd = new Date(newStart.getTime() + duration);

    // Call the parent handler with the updated event info
    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
  };

  return (
    <div className="flex h-[1500px] relative border border-border rounded-md">
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
          <div key={day.toISOString()} className="flex-1 flex flex-col min-w-[120px]">
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
                const hours = Math.floor(y / 60);
                const minutes = Math.round((y % 60) / 60 * 60);
                const droppedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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
                  {/* Half-hour marker */}
                  <div className="h-[30px] border-b border-border/30"></div>
                </div>
              ))}
              
              {/* Events for this day */}
              {filterEventsByDate(events, day).map((event) => (
                <div 
                  key={event.id}
                  draggable 
                  onDragStart={() => handleDragStart(event)}
                  className="absolute w-full px-1"
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
  const minutes = now.getHours() * 60 + now.getMinutes();
  
  return (
    <motion.div 
      className="absolute w-full h-[2px] bg-red-500 z-20 pointer-events-none"
      style={{ top: `${minutes}px` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute -left-1 -top-[4px] w-2 h-2 rounded-full bg-red-500" />
    </motion.div>
  );
};
