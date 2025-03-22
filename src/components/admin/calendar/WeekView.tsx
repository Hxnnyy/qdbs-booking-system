
import React, { useEffect } from 'react';
import { addDays, startOfWeek, isToday } from 'date-fns';
import { CalendarViewProps } from '@/types/calendar';
import { filterEventsByWeek } from '@/utils/eventFilterUtils';
import { getHolidayEventsForDate } from '@/utils/holidayIndicatorUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { TimeColumn } from './TimeColumn';
import { DayHeader } from './DayHeader';
import { HolidayIndicator } from './HolidayIndicator';
import { useCalendarDragDrop } from '@/hooks/useCalendarDragDrop';
import { CalendarTimeGrid } from './CalendarTimeGrid';
import { CalendarEventRenderer } from './CalendarEventRenderer';
import { DragPreviewIndicator } from './DragPreviewIndicator';

export const WeekView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const { startHour, endHour, autoScrollToCurrentTime } = useCalendarSettings();
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const totalHours = endHour - startHour;
  const calendarHeight = totalHours * 60;

  const {
    draggingEvent,
    dragPreview,
    displayEvents,
    setDisplayEvents,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
    setDragPreview
  } = useCalendarDragDrop(events, onEventDrop, startHour);

  useEffect(() => {
    const filtered = filterEventsByWeek(events, date);
    console.log(`Week view: Generated ${filtered.length} events, including lunch breaks`);
    setDisplayEvents(filtered);
  }, [events, date, setDisplayEvents]);

  useEffect(() => {
    if (!autoScrollToCurrentTime) return;
    
    const now = new Date();
    const today = weekDays.findIndex(day => isToday(day));
    
    if (today !== -1) {
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
  }, [date, weekDays, startHour, endHour, autoScrollToCurrentTime]);

  // Enhanced drag handlers
  const handleDragOverWithDay = (e: React.DragEvent, dayIndex: number) => {
    handleDragOver(e, dayIndex);
  };

  const handleDragEndWithDay = (e: React.DragEvent, dayIndex: number) => {
    const selectedDate = weekDays[dayIndex];
    handleDragEnd(e, selectedDate, dayIndex);
  };

  const isEventDragging = (eventId: string) => {
    return draggingEvent?.id === eventId;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear preview if dragging outside the calendar area
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragPreview(null);
    }
  };

  // Add handler for when drag operation is cancelled
  useEffect(() => {
    const handleDocumentDragEnd = () => {
      handleDragCancel();
    };

    document.addEventListener('dragend', handleDocumentDragEnd);
    
    return () => {
      document.removeEventListener('dragend', handleDocumentDragEnd);
    };
  }, [handleDragCancel]);

  const hasHolidayEvents = weekDays.some(day => 
    getHolidayEventsForDate(events, day).length > 0
  );

  return (
    <div className="h-full calendar-view week-view">
      <div className="calendar-header grid grid-cols-[4rem_repeat(7,1fr)] border-b border-border sticky top-0 z-20 bg-background">
        <div className="border-r border-border h-12"></div>
        
        {weekDays.map((day, index) => (
          <div key={index} className="border-r last:border-r-0 border-border">
            <DayHeader date={day} holidayEvents={[]} />
          </div>
        ))}
      </div>
      
      {hasHolidayEvents && (
        <div className="grid grid-cols-[4rem_repeat(7,1fr)] border-b border-border bg-background">
          <div className="border-r border-border"></div>
          
          {weekDays.map((day, index) => {
            const dayHolidayEvents = getHolidayEventsForDate(events, day);
            
            return (
              <div key={`holiday-${index}`} className="border-r last:border-r-0 border-border">
                {dayHolidayEvents.length > 0 && (
                  <HolidayIndicator holidayEvents={dayHolidayEvents} />
                )}
              </div>
            );
          })}
        </div>
      )}
      
      <div className="calendar-body grid grid-cols-[4rem_repeat(7,1fr)]">
        <TimeColumn startHour={startHour} totalHours={totalHours} />
        
        {weekDays.map((day, dayIndex) => (
          <div 
            key={dayIndex}
            className="relative border-r last:border-r-0 border-border day-column"
            style={{ height: `${calendarHeight}px` }}
            onDragOver={(e) => handleDragOverWithDay(e, dayIndex)}
            onDrop={(e) => handleDragEndWithDay(e, dayIndex)}
            onDragLeave={handleDragLeave}
          >
            <CalendarTimeGrid
              totalHours={totalHours}
              startHour={startHour}
              date={day}
            >
              <CalendarEventRenderer
                events={displayEvents}
                startHour={startHour}
                onEventClick={onEventClick}
                onDragStart={handleDragStart}
                isDragging={isEventDragging}
                date={day}
              />
            </CalendarTimeGrid>
          </div>
        ))}
      </div>
      
      <DragPreviewIndicator dragPreview={dragPreview} isWeekView={true} />
    </div>
  );
};
