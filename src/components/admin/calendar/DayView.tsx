
import React, { useState, useEffect } from 'react';
import { format, addHours, startOfDay, isToday, addMinutes, isWithinInterval } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { motion } from 'framer-motion';
import { filterEventsByDate } from '@/utils/calendarUtils';

// Constants for calendar settings
const START_HOUR = 8; // 8 AM
const END_HOUR = 22; // 10 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;
const MINUTES_PER_SLOT = 15; // 15-minute intervals

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
    const filtered = filterEventsByDate(events, date);
    setDisplayEvents(filtered);
  }, [events, date]);
  
  // Generate time slots for the day (from 8AM to 10PM)
  const timeSlots = Array.from({ length: TOTAL_HOURS * 4 }).map((_, index) => {
    const minutes = index * MINUTES_PER_SLOT;
    const slotTime = addMinutes(addHours(startOfDay(date), START_HOUR), minutes);
    return {
      time: format(slotTime, 'HH:mm'),
      label: index % 4 === 0 ? format(slotTime, 'ha') : '',
      isHour: index % 4 === 0
    };
  });

  const hourTimeSlots = Array.from({ length: TOTAL_HOURS + 1 }).map((_, index) => {
    const slotTime = addHours(startOfDay(date), START_HOUR + index);
    return {
      time: format(slotTime, 'HH:mm'),
      label: format(slotTime, 'ha')
    };
  });

  const handleDragStart = (event: CalendarEvent) => {
    setDraggingEvent(event);
  };

  const handleDragEnd = (e: React.DragEvent, droppedTime: string) => {
    if (!draggingEvent) return;
    
    // Parse the dropped time to get hours and minutes
    const [hours, minutes] = droppedTime.split(':').map(Number);
    
    // Create the new start date with the same date but updated time
    const newStart = new Date(date);
    newStart.setHours(hours, minutes, 0, 0);
    
    // Calculate the original duration to maintain it
    const duration = draggingEvent.end.getTime() - draggingEvent.start.getTime();
    
    // Calculate new end time based on original duration
    const newEnd = new Date(newStart.getTime() + duration);

    // Call the parent handler with the updated event info
    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
  };

  // Function to snap to 15-minute intervals
  const snapToTimeSlot = (y: number, container: DOMRect): string => {
    // Find how many minutes past START_HOUR based on pixel position
    const totalMinutesInView = TOTAL_HOURS * 60;
    const pixelsPerMinute = container.height / totalMinutesInView;
    
    // Calculate minutes from the top
    let minutes = Math.round(y / pixelsPerMinute);
    
    // Snap to nearest 15-minute interval
    minutes = Math.round(minutes / MINUTES_PER_SLOT) * MINUTES_PER_SLOT;
    
    // Calculate hours and minutes
    const hours = START_HOUR + Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    // Format and return the time
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-[840px] relative border border-border rounded-md">
      {/* Time column */}
      <div className="w-20 flex-shrink-0 border-r border-border bg-background z-10">
        {/* Empty cell for header alignment */}
        <div className="h-12 border-b border-border"></div>
        
        {hourTimeSlots.map((slot, index) => (
          <div key={slot.time} className="h-[60px] border-b border-border flex items-start pl-2 pt-1">
            <span className="text-xs text-muted-foreground">{slot.label}</span>
          </div>
        ))}
      </div>
      
      {/* Events column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Day header */}
        <div className={`h-12 border-b border-border font-medium flex flex-col items-center justify-center ${
          isToday(date) ? 'bg-primary/10' : ''
        }`}>
          <div className="text-sm">{format(date, 'EEEE')}</div>
          <div className="text-xs text-muted-foreground">{format(date, 'MMMM d')}</div>
        </div>
        
        {/* Time grid and events - removed overflow-y-auto to prevent scrolling */}
        <div 
          className="flex-1 relative"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const droppedTime = snapToTimeSlot(y, rect);
            handleDragEnd(e, droppedTime);
          }}
        >
          {/* Time grid container - holds 15-minute slots */}
          <div className="relative h-[840px]">
            {/* Major time grid lines (hours) */}
            {hourTimeSlots.map((slot, index) => (
              <div 
                key={`hour-${slot.time}`} 
                className="absolute w-full h-[60px] border-b border-border"
                style={{ top: `${index * 60}px` }}
              >
                {/* Quarter-hour markers */}
                {index < hourTimeSlots.length - 1 && (
                  <>
                    <div className="absolute w-full h-[1px] border-b border-border/30" style={{ top: '15px' }}></div>
                    <div className="absolute w-full h-[1px] border-b border-border/30" style={{ top: '30px' }}></div>
                    <div className="absolute w-full h-[1px] border-b border-border/30" style={{ top: '45px' }}></div>
                  </>
                )}
              </div>
            ))}
            
            {/* Events */}
            {displayEvents.map((event) => (
              <div 
                key={event.id}
                draggable 
                onDragStart={() => handleDragStart(event)}
                className="absolute w-full"
              >
                <CalendarEventComponent 
                  event={event} 
                  onEventClick={onEventClick}
                  isDragging={draggingEvent?.id === event.id}
                />
              </div>
            ))}
            
            {/* Current time indicator */}
            {isToday(date) && <CurrentTimeIndicator />}
          </div>
        </div>
      </div>
    </div>
  );
};

const CurrentTimeIndicator: React.FC = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Only show if time is within our display range
  if (hours < START_HOUR || hours >= END_HOUR) return null;
  
  // Calculate position
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
