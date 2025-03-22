
import React, { useEffect, useCallback } from 'react';
import { isToday } from 'date-fns';
import { CalendarViewProps } from '@/types/calendar';
import { filterEventsByDate } from '@/utils/calendarUtils';
import { getHolidayEventsForDate } from '@/utils/holidayIndicatorUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { TimeColumn } from './TimeColumn';
import { DayHeader } from './DayHeader';
import { HolidayIndicator } from './HolidayIndicator';
import { useCalendarDragDrop } from '@/hooks/useCalendarDragDrop';
import { CalendarTimeGrid } from './CalendarTimeGrid';
import { CalendarEventRenderer } from './CalendarEventRenderer';
import { DragPreviewIndicator } from './DragPreviewIndicator';

export const DayView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const { startHour, endHour, autoScrollToCurrentTime } = useCalendarSettings();
  const totalHours = endHour - startHour;
  const calendarHeight = totalHours * 60;
  const holidayEvents = getHolidayEventsForDate(events, date);

  const {
    draggingEvent,
    dragPreview,
    displayEvents,
    setDisplayEvents,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    setDragPreview,
    isEventDragging
  } = useCalendarDragDrop(events, onEventDrop, startHour);

  useEffect(() => {
    if (!draggingEvent) {
      const filtered = filterEventsByDate(events, date);
      setDisplayEvents(filtered);
    }
  }, [events, date, setDisplayEvents, draggingEvent]);

  useEffect(() => {
    if (isToday(date) && autoScrollToCurrentTime) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      if (hours >= startHour && hours < endHour) {
        const position = (hours - startHour) * 60 + minutes;
        
        setTimeout(() => {
          const container = document.querySelector('.calendar-scrollable-container');
          if (container) {
            container.scrollTop = position - 100;
          }
        }, 100);
      }
    }
  }, [date, startHour, endHour, autoScrollToCurrentTime]);

  // Enhanced drag event handlers
  const handleDragEndWithDate = useCallback((e: React.DragEvent) => {
    handleDragEnd(e, date);
  }, [handleDragEnd, date]);

  // Handler for drag leaving the drop area
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear preview if dragging outside the calendar area
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragPreview(null);
    }
  }, [setDragPreview]);

  return (
    <div className="h-full calendar-view day-view">
      <div className="calendar-header grid grid-cols-[4rem_1fr] border-b border-border sticky top-0 z-20 bg-background">
        <div className="border-r border-border h-12"></div>
        <DayHeader date={date} holidayEvents={[]} />
      </div>
      
      {/* Holiday indicator row - separate from the header */}
      {holidayEvents.length > 0 && (
        <div className="grid grid-cols-[4rem_1fr] border-b border-border bg-background">
          <div className="border-r border-border"></div>
          <HolidayIndicator holidayEvents={holidayEvents} />
        </div>
      )}
      
      <div className="calendar-body grid grid-cols-[4rem_1fr]">
        <TimeColumn startHour={startHour} totalHours={totalHours} />
        <div 
          className="relative day-column"
          style={{ height: `${calendarHeight}px` }}
          onDragOver={handleDragOver}
          onDrop={handleDragEndWithDate}
          onDragLeave={handleDragLeave}
        >
          <div className="absolute top-0 left-0 right-0 bottom-0">
            <CalendarTimeGrid
              totalHours={totalHours}
              startHour={startHour}
              date={date}
            >
              <CalendarEventRenderer
                events={displayEvents}
                startHour={startHour}
                onEventClick={onEventClick}
                onDragStart={handleDragStart}
                isDragging={isEventDragging}
              />
            </CalendarTimeGrid>
          </div>
        </div>
      </div>
      
      <DragPreviewIndicator dragPreview={dragPreview} />
    </div>
  );
};
