
import React, { useState, useEffect } from 'react';
import { format, addHours, startOfDay, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { motion } from 'framer-motion';
import { filterEventsByDate } from '@/utils/calendarUtils';

export const DayView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);

  // Apply filtering when events or date changes
  useEffect(() => {
    console.log('DayView events:', events.length);
    const filtered = filterEventsByDate(events, date);
    console.log('Filtered events for day:', filtered.length, date);
    setDisplayEvents(filtered);
  }, [events, date]);
  
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
        {/* Empty cell for header alignment (for consistency with WeekView) */}
        <div className="h-12 border-b border-border"></div>
        
        {timeSlots.map((slot) => (
          <div key={slot.time} className="h-[60px] border-b border-border flex items-start pl-2 pt-1">
            <span className="text-xs text-muted-foreground">{slot.label}</span>
          </div>
        ))}
      </div>
      
      {/* Events column */}
      <div className="flex-1 flex flex-col">
        {/* Day header (for consistency with WeekView) */}
        <div className={`h-12 border-b border-border font-medium flex flex-col items-center justify-center ${
          isToday(date) ? 'bg-primary/10' : ''
        }`}>
          <div className="text-sm">{format(date, 'EEEE')}</div>
          <div className="text-xs text-muted-foreground">{format(date, 'MMMM d')}</div>
        </div>
        
        {/* Time grid and events */}
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
          {displayEvents.map((event) => (
            <div 
              key={event.id}
              draggable 
              onDragStart={() => handleDragStart(event)}
              className="absolute w-full px-1"
              style={{ top: 0, left: 0, right: 0 }}
            >
              <CalendarEventComponent 
                event={event} 
                onEventClick={onEventClick} 
              />
            </div>
          ))}
          
          {/* Current time indicator */}
          {isToday(date) && <CurrentTimeIndicator />}
        </div>
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
