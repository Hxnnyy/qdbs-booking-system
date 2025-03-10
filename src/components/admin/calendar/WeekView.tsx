
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

  // Generate hour time slots
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
    // Calculate the total height of the time grid
    const timeGridHeight = container.height;
    
    // Calculate the height of each hour cell
    const hourHeight = timeGridHeight / TOTAL_HOURS;
    
    // Calculate the height of each 15-minute slot
    const slotHeight = hourHeight / 4;
    
    // Determine which slot we're in based on the y position
    let slotIndex = Math.floor(y / slotHeight);
    
    // Ensure we're within bounds
    slotIndex = Math.max(0, Math.min(slotIndex, TOTAL_HOURS * 4 - 1));
    
    // Calculate the hour and minute from the slot index
    const hour = START_HOUR + Math.floor(slotIndex / 4);
    const minute = (slotIndex % 4) * 15;
    
    // Format and return the time
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-[840px] relative border border-border rounded-md">
      {/* Time column */}
      <div className="w-20 flex-shrink-0 border-r border-border bg-background z-10">
        {/* Empty cell for header alignment */}
        <div className="h-12 border-b border-border"></div>
        
        {/* Hour labels */}
        <div className="relative h-[840px]">
          {hourTimeSlots.map((slot, index) => (
            <div 
              key={slot.time} 
              className="absolute w-full h-[60px] flex items-start pl-2 pt-1 pointer-events-none"
              style={{ top: `${index * 60}px` }}
            >
              <span className="text-xs text-muted-foreground">{slot.label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Days columns */}
      <div className="flex-1 flex">
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
              className="flex-1 relative border-r border-border"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const y = e.clientY - rect.top;
                const droppedTime = snapToTimeSlot(y, rect);
                handleDragEnd(e, day, droppedTime);
              }}
            >
              {/* Time grid container */}
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
                {filterEventsByDate(events, day).map((event) => {
                  // Calculate position and height based on event times
                  const eventStart = event.start;
                  const eventEnd = event.end;
                  
                  // Calculate minutes from START_HOUR for positioning
                  const startHour = eventStart.getHours();
                  const startMinute = eventStart.getMinutes();
                  const endHour = eventEnd.getHours();
                  const endMinute = eventEnd.getMinutes();
                  
                  // Convert to minutes from START_HOUR
                  const startMinutes = (startHour - START_HOUR) * 60 + startMinute;
                  const endMinutes = (endHour - START_HOUR) * 60 + endMinute;
                  
                  // Calculate height and top position (1 minute = 1px)
                  const height = Math.max(endMinutes - startMinutes, 15); // Minimum 15px height
                  const top = startMinutes;
                  
                  return (
                    <div 
                      key={event.id}
                      draggable 
                      onDragStart={() => handleDragStart(event)}
                      className="absolute w-full px-1"
                      style={{ 
                        top: `${top}px`, 
                        height: `${height}px`,
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
                
                {/* Current time indicator */}
                {isToday(day) && <CurrentTimeIndicator />}
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
