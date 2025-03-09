
import React, { useState, useEffect } from 'react';
import { format, addHours, startOfDay, addDays, startOfWeek, isToday, addMinutes } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { motion } from 'framer-motion';
import { filterEventsByDate } from '@/utils/calendarUtils';

// Constants for calendar settings
const START_HOUR = 8; // 8 AM
const END_HOUR = 22; // 10 PM
const TOTAL_HOURS = END_HOUR - START_HOUR;
const MINUTES_PER_SLOT = 15; // 15-minute intervals

export const WeekView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);

  // Calculate the start of the week
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Week starts on Monday
  
  // Generate days for the week (Monday to Sunday)
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    return addDays(weekStart, index);
  });

  // Generate time slots for the day (from 8AM to 10PM)
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

  const handleDragEnd = (e: React.DragEvent, droppedDay: Date, droppedTime: string) => {
    if (!draggingEvent) return;
    
    // Parse the dropped time
    const [hours, minutes] = droppedTime.split(':').map(Number);
    
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

  // Log events for debugging (optional)
  useEffect(() => {
    console.log('WeekView events:', events.length);
  }, [events]);

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
      
      {/* Days columns */}
      <div className="flex-1 flex overflow-x-auto">
        {weekDays.map((day) => (
          <div key={day.toISOString()} className="flex-1 flex flex-col min-w-[120px]">
            {/* Day header */}
            <div 
              className={`h-12 border-b border-r border-border font-medium flex flex-col items-center justify-center ${
                isToday(day) ? 'bg-primary/10' : ''
              }`}
            >
              <div className="text-sm">{format(day, 'EEE')}</div>
              <div className="text-xs text-muted-foreground">{format(day, 'MMM d')}</div>
            </div>
            
            {/* Time slots for the day */}
            <div 
              className="flex-1 relative border-r border-border overflow-y-auto"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top + e.currentTarget.scrollTop;
                const droppedTime = snapToTimeSlot(y, rect);
                handleDragEnd(e, day, droppedTime);
              }}
            >
              {/* Time grid container - set to match the day view */}
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
                
                {/* Events for this day */}
                {filterEventsByDate(events, day).map((event) => (
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
                {isToday(day) && (
                  <CurrentTimeIndicator />
                )}
              </div>
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
