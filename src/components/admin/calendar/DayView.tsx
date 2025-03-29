
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { format, isToday, addMinutes } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { filterEventsByDate } from '@/utils/calendarUtils';
import { getHolidayEventsForDate } from '@/utils/holidayIndicatorUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { processOverlappingEvents } from '@/utils/processOverlappingEvents';
import { TimeColumn } from './TimeColumn';
import { DayHeader } from './DayHeader';
import { HolidayIndicator } from './HolidayIndicator';
import { toast } from 'sonner';

interface DragState {
  isActive: boolean;
  ghostPosition: { top: number, height: number } | null;
  currentTime: string;
  currentDate: string;
  event: CalendarEvent | null;
  startY: number;
}

interface DayViewProps extends CalendarViewProps {
  refreshCalendar?: () => void;
}

export const DayView: React.FC<DayViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick,
  refreshCalendar
}) => {
  const { startHour, endHour, autoScrollToCurrentTime } = useCalendarSettings();
  // Memoize the initial events filtering to avoid repeated calculation on render
  const displayEvents = useMemo(() => 
    filterEventsByDate(events, date),
    [events, date]
  );
  
  const totalHours = endHour - startHour;
  const calendarHeight = totalHours * 60;
  const holidayEvents = useMemo(() => 
    getHolidayEventsForDate(events, date),
    [events, date]
  );
  
  const columnRef = useRef<HTMLDivElement>(null);
  const dateFormatted = format(date, 'yyyy-MM-dd');
  
  const [dragState, setDragState] = useState<DragState>({
    isActive: false,
    ghostPosition: null,
    currentTime: '',
    currentDate: '',
    event: null,
    startY: 0
  });

  // Auto-scroll to current time effect
  useEffect(() => {
    if (isToday(date) && autoScrollToCurrentTime) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      if (hours >= startHour && hours < endHour) {
        const position = (hours - startHour) * 60 + minutes;
        
        // Use requestAnimationFrame for smoother scrolling
        requestAnimationFrame(() => {
          const container = document.querySelector('.calendar-scrollable-container');
          if (container) {
            container.scrollTop = position - 100;
          }
        });
      }
    }
  }, [date, startHour, endHour, autoScrollToCurrentTime]);

  // Optimized drag handlers using useCallback
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    
    if (!columnRef.current || !dragState.event) return;
    
    // Calculate position in the column
    const rect = columnRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Calculate time based on position
    const minutes = Math.floor(y);
    const hours = startHour + Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    // Format time string
    const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    const dateString = format(date, 'yyyy-MM-dd');
    
    // Update ghost position
    const eventDuration = dragState.event.end.getTime() - dragState.event.start.getTime();
    const durationMinutes = eventDuration / (1000 * 60);
    
    setDragState(prev => ({
      ...prev,
      ghostPosition: { 
        top: minutes, 
        height: durationMinutes 
      },
      currentTime: timeString,
      currentDate: dateString
    }));
  }, [dragState.event, date, startHour]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!columnRef.current) return;
    
    // Check if we're leaving the column entirely
    const rect = columnRef.current.getBoundingClientRect();
    if (
      e.clientX < rect.left || 
      e.clientX > rect.right || 
      e.clientY < rect.top || 
      e.clientY > rect.bottom
    ) {
      setDragState(prev => ({
        ...prev,
        ghostPosition: null
      }));
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!columnRef.current || !dragState.ghostPosition || !dragState.event) return;
    
    try {
      const dragData = JSON.parse(e.dataTransfer.getData('application/json'));
      const eventId = dragData.eventId;
      
      // Find the event being dropped
      const droppedEvent = events.find(event => event.id === eventId);
      if (!droppedEvent) {
        toast.error('Event not found');
        return;
      }
      
      // Calculate new start time
      const [hours, minutes] = dragState.currentTime.split(':').map(Number);
      const newStart = new Date(date);
      newStart.setHours(hours, minutes, 0, 0);
      
      // Calculate new end time based on the duration of the original event
      const duration = droppedEvent.end.getTime() - droppedEvent.start.getTime();
      const newEnd = new Date(newStart.getTime() + duration);
      
      // Call the callback to update the event
      if (onEventDrop) {
        await onEventDrop(droppedEvent, newStart, newEnd);
      }
      
      // Force refresh after drag
      if (refreshCalendar) {
        setTimeout(() => refreshCalendar(), 100);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
      toast.error('Failed to reschedule appointment');
    } finally {
      // Reset drag state
      setDragState({
        isActive: false,
        ghostPosition: null,
        currentTime: '',
        currentDate: '',
        event: null,
        startY: 0
      });
    }
  }, [dragState, events, date, onEventDrop, refreshCalendar]);

  const handleEventDragStart = useCallback((event: CalendarEvent) => {
    setDragState({
      isActive: true,
      ghostPosition: null,
      currentTime: '',
      currentDate: '',
      event: event,
      startY: 0
    });
  }, []);

  const handleCalendarClick = useCallback((e: React.MouseEvent) => {
    // Only reset if clicking directly on the calendar, not on an event
    if (e.target === e.currentTarget) {
      // No drag state to reset
    }
  }, []);

  const viewKey = useMemo(() => 
    `day-view-${dateFormatted}-${displayEvents.length}`,
    [dateFormatted, displayEvents.length]
  );
  
  // Memoize the processing of overlapping events to avoid recalculation
  const processedEvents = useMemo(() => 
    processOverlappingEvents(displayEvents), 
    [displayEvents]
  );

  // Memoize the grid lines to prevent recreation on every render
  const renderGridLines = useMemo(() => (
    Array.from({ length: totalHours + 1 }).map((_, index) => (
      <div 
        key={`grid-${index}`}
        className="absolute w-full h-[60px] border-b border-border"
        style={{ top: `${index * 60}px` }}
      >
        {index < totalHours && (
          <>
            <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '15px' }}></div>
            <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '30px' }}></div>
            <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '45px' }}></div>
          </>
        )}
      </div>
    ))
  ), [totalHours]);

  // Memoize the current time indicator to prevent recreation on every render
  const currentTimeIndicator = useMemo(() => {
    if (!isToday(date)) return null;
    
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    if (hours < startHour || hours >= endHour) return null;
    
    const position = (hours - startHour) * 60 + minutes;
    
    return (
      <div 
        className="absolute left-0 right-0 h-[2px] bg-red-500 z-20 pointer-events-none"
        style={{ top: `${position}px` }}
      >
        <div className="absolute -left-1 -top-[4px] w-2 h-2 rounded-full bg-red-500" />
      </div>
    );
  }, [date, startHour, endHour]);

  // Memoize the drag ghost position indicator
  const dragGhostIndicator = useMemo(() => {
    if (!dragState.ghostPosition) return null;
    
    return (
      <div 
        className="absolute w-full bg-primary/30 border-l-4 border-primary z-50 pointer-events-none rounded-sm"
        style={{ 
          top: `${dragState.ghostPosition.top}px`, 
          height: `${dragState.ghostPosition.height}px`,
          left: 0,
          right: 0
        }}
      >
        <div className="px-2 py-1 text-xs font-medium">
          Drop to reschedule: {dragState.currentTime}
        </div>
      </div>
    );
  }, [dragState.ghostPosition, dragState.currentTime]);

  // Memoize empty state display
  const emptyStateDisplay = useMemo(() => {
    if (processedEvents.length > 0) return null;
    
    return (
      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
        No events on this day
      </div>
    );
  }, [processedEvents.length]);

  return (
    <div className="h-full calendar-view day-view" key={viewKey}>
      <div className="calendar-header grid grid-cols-[4rem_1fr] border-b border-border sticky top-0 z-20 bg-background">
        <div className="border-r border-border h-12"></div>
        <DayHeader date={date} holidayEvents={[]} />
      </div>
      
      {holidayEvents.length > 0 && (
        <div className="grid grid-cols-[4rem_1fr] border-b border-border bg-background">
          <div className="border-r border-border"></div>
          <HolidayIndicator holidayEvents={holidayEvents} />
        </div>
      )}
      
      <div className="calendar-body grid grid-cols-[4rem_1fr]" onClick={handleCalendarClick}>
        <TimeColumn startHour={startHour} totalHours={totalHours} />
        <div 
          ref={columnRef}
          className="relative day-column"
          style={{ height: `${calendarHeight}px` }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="absolute top-0 left-0 right-0 bottom-0">
            {renderGridLines}
            {currentTimeIndicator}
            {dragGhostIndicator}
            {emptyStateDisplay}

            {processedEvents.map(({ event, slotIndex, totalSlots }) => {
              const eventHour = event.start.getHours();
              const eventMinute = event.start.getMinutes();
              
              if (eventHour < startHour || eventHour >= endHour) return null;
              
              const top = (eventHour - startHour) * 60 + eventMinute;
              const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
              const height = Math.max(durationMinutes, 15);
              
              const uniqueEventKey = `event-${event.id}-${dateFormatted}-${top}`;
              
              return (
                <div 
                  key={`event-container-${uniqueEventKey}`}
                  className="absolute w-full"
                  style={{ 
                    top: `${top}px`, 
                    height: `${height}px`,
                    padding: 0
                  }}
                >
                  <div className="h-full w-full">
                    <CalendarEventComponent 
                      key={uniqueEventKey}
                      event={event} 
                      onEventClick={onEventClick}
                      slotIndex={slotIndex}
                      totalSlots={totalSlots}
                      onDragStart={handleEventDragStart}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
