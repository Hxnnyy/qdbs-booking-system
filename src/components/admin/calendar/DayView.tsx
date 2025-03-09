import React, { useState, useEffect } from 'react';
import { format, addHours, startOfDay, isToday, setHours, setMinutes } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { motion } from 'framer-motion';
import { filterEventsByDate } from '@/utils/calendarUtils';

// Constants for time display
const START_HOUR = 8; // 8 AM
const END_HOUR = 20; // 8 PM
const HOURS_TO_DISPLAY = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 120; // Each hour is 120px tall

export const DayView: React.FC<CalendarViewProps> = ({
  date,
  onDateChange,
  events,
  onEventDrop,
  onEventClick,
  selectedBarberId
}) => {
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);

  // Apply filtering when events or date changes
  useEffect(() => {
    let filtered = filterEventsByDate(events, date);

    // If a barber is selected, filter by barber ID
    if (selectedBarberId) {
      filtered = filtered.filter(event => event.barberId === selectedBarberId);
    }
    setDisplayEvents(filtered);
  }, [events, date, selectedBarberId]);

  // Generate time slots for the day (8AM to 8PM)
  const timeSlots = Array.from({
    length: HOURS_TO_DISPLAY
  }).map((_, index) => {
    const slotTime = addHours(setHours(startOfDay(date), START_HOUR), index);
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

    // Snap minutes to 15-minute intervals (0, 15, 30, 45)
    const snappedMinutes = Math.round(minutes / 15) * 15;
    const newStart = new Date(date);
    newStart.setHours(hours, snappedMinutes, 0, 0);

    // Calculate new end time based on original duration
    const duration = draggingEvent.end.getTime() - draggingEvent.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    // Call the parent handler with the updated event info
    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
  };

  // Calculate position and height for each event
  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinute = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinute = event.end.getMinutes();

    // Calculate position from the top (relative to START_HOUR)
    const top = (startHour - START_HOUR + startMinute / 60) * HOUR_HEIGHT;

    // Calculate height based on duration
    const durationHours = endHour - startHour + (endMinute - startMinute) / 60;
    const height = durationHours * HOUR_HEIGHT;
    return {
      top: `${top}px`,
      height: `${height}px`
    };
  };
  return <div className="flex h-full overflow-y-auto">
      {/* Time column */}
      <div className="w-16 flex-shrink-0 border-r border-border bg-background sticky left-0">
        {/* Empty cell for header alignment */}
        <div className="h-12 border-b border-border sticky top-0 bg-background z-10"></div>
        
        {/* Time slots with properly positioned labels */}
        {timeSlots.map(slot => <div key={slot.time} className="h-[120px] border-b border-border relative">
            <div className="absolute -top-3 left-3 z-10 my-[20px]">
              <span className="text-xs text-muted-foreground font-medium mx-0 py-0 my-0 px-0">
                {slot.label}
              </span>
            </div>
          </div>)}
      </div>
      
      {/* Events column */}
      <div className="flex-1 flex flex-col">
        {/* Day header */}
        <div className={`h-12 border-b border-border font-medium flex flex-col items-center justify-center sticky top-0 z-10 ${isToday(date) ? 'bg-primary/20' : 'bg-primary/5'}`}>
          <div className="text-sm font-semibold">{format(date, 'EEEE')}</div>
          <div className="text-xs font-medium text-primary">{format(date, 'MMMM d')}</div>
        </div>
        
        {/* Time grid and events */}
        <div className="flex-1 relative" onDragOver={e => e.preventDefault()} onDrop={e => {
        const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
        // Calculate hours and raw minutes
        const hours = Math.floor(y / HOUR_HEIGHT) + START_HOUR;
        const rawMinutes = Math.round(y % HOUR_HEIGHT / HOUR_HEIGHT * 60);

        // Snap to 15-minute intervals
        const snappedMinutes = Math.round(rawMinutes / 15) * 15;

        // Format the time string
        const droppedTime = `${hours.toString().padStart(2, '0')}:${snappedMinutes.toString().padStart(2, '0')}`;
        handleDragEnd(e, droppedTime);
      }}>
          {/* Time grid lines */}
          {timeSlots.map(slot => <div key={slot.time} className="h-[120px] border-b border-border hover:bg-muted/40 transition-colors" onDragOver={e => e.preventDefault()}>
              {/* 15-minute markers */}
              <div className="h-[30px] border-b border-border/20"></div>
              <div className="h-[30px] border-b border-border/30"></div>
              <div className="h-[30px] border-b border-border/20"></div>
            </div>)}
          
          {/* Events */}
          {displayEvents.map(event => <div key={event.id} draggable onDragStart={() => handleDragStart(event)} className="absolute w-full px-2" style={getEventStyle(event)}>
              <CalendarEventComponent event={event} onEventClick={onEventClick} />
            </div>)}
          
          {/* Current time indicator */}
          {isToday(date) && <CurrentTimeIndicator hourHeight={HOUR_HEIGHT} />}
        </div>
      </div>
    </div>;
};
interface CurrentTimeIndicatorProps {
  hourHeight: number;
}
const CurrentTimeIndicator: React.FC<CurrentTimeIndicatorProps> = ({
  hourHeight
}) => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Only show if within display hours
  if (hours < START_HOUR || hours >= END_HOUR) {
    return null;
  }
  const position = (hours - START_HOUR) * hourHeight + minutes / 60 * hourHeight;
  return <motion.div className="absolute w-full h-[2px] bg-red-500 z-20 pointer-events-none" style={{
    top: `${position}px`
  }} initial={{
    opacity: 0
  }} animate={{
    opacity: 1
  }} transition={{
    duration: 0.5
  }}>
      <div className="absolute -left-1 -top-[4px] w-2 h-2 rounded-full bg-red-500" />
    </motion.div>;
};