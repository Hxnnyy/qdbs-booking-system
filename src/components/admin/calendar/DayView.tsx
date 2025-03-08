
import React, { useState } from 'react';
import { format, addHours, startOfDay } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { motion } from 'framer-motion';
import { filterEventsByDate } from '@/utils/calendarUtils';

export const DayView: React.FC<CalendarViewProps> = ({ 
  date, 
  events, 
  onEventDrop,
  onEventClick
}) => {
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);

  const filteredEvents = filterEventsByDate(events, date);
  
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

  const handleDragEnd = (e: React.DragEvent, droppedTime: string) => {
    if (!draggingEvent) return;
    
    // Parse the dropped time
    const [hours, minutes] = droppedTime.split(':').map(Number);
    const newStart = new Date(date);
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
        {timeSlots.map((slot) => (
          <div key={slot.time} className="h-[60px] border-b border-border flex items-start pl-2 pt-1">
            <span className="text-xs text-muted-foreground">{slot.label}</span>
          </div>
        ))}
      </div>
      
      {/* Events column */}
      <div 
        className="flex-1 relative"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
          const hours = Math.floor(y / 60);
          const minutes = Math.round((y % 60) / 60 * 60);
          const droppedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
          handleDragEnd(e, droppedTime);
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
        
        {/* Events */}
        {filteredEvents.map((event) => (
          <div 
            key={event.id}
            draggable 
            onDragStart={() => handleDragStart(event)}
            className="absolute w-full"
          >
            <CalendarEventComponent 
              event={event} 
              onEventClick={onEventClick} 
            />
          </div>
        ))}
        
        {/* Current time indicator */}
        <CurrentTimeIndicator date={date} />
      </div>
    </div>
  );
};

const CurrentTimeIndicator: React.FC<{ date: Date }> = ({ date }) => {
  const now = new Date();
  const isToday = now.toDateString() === date.toDateString();
  
  if (!isToday) return null;
  
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
