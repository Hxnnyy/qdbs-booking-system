
import React, { useState, useEffect, useRef } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { filterEventsByWeek } from '@/utils/eventFilterUtils';
import { getHolidayEventsForDate } from '@/utils/holidayIndicatorUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { processOverlappingEvents } from '@/utils/processOverlappingEvents';
import { TimeColumn } from './TimeColumn';
import { DayHeader } from './DayHeader';
import { HolidayIndicator } from './HolidayIndicator';
import { toast } from 'sonner';

interface DragState {
  isActive: boolean;
  ghostPosition: { 
    top: number, 
    height: number,
    dayIndex: number 
  } | null;
  currentTime: string;
  currentDate: Date | null;
  event: CalendarEvent | null;
  startY: number;
  startDayIndex: number;
}

export const WeekView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const { startHour, endHour, autoScrollToCurrentTime } = useCalendarSettings();
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const totalHours = endHour - startHour;
  const calendarHeight = totalHours * 60;
  const dayColumnRefs = useRef<(HTMLDivElement | null)[]>(Array(7).fill(null));

  // Drag state
  const [dragState, setDragState] = useState<DragState>({
    isActive: false,
    ghostPosition: null,
    currentTime: '',
    currentDate: null,
    event: null,
    startY: 0,
    startDayIndex: 0
  });

  useEffect(() => {
    const filtered = filterEventsByWeek(events, date);
    console.log(`Week view: Generated ${filtered.length} events, including lunch breaks`);
    setDisplayEvents(filtered);
  }, [events, date]);

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

  const roundToNearestFifteenMinutes = (minutes: number): number => {
    return Math.round(minutes / 15) * 15;
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    
    if (!dayColumnRefs.current[dayIndex] || !dragState.event) return;
    
    // Calculate position in the column
    const rect = dayColumnRefs.current[dayIndex]!.getBoundingClientRect();
    const y = e.clientY - rect.top;
    
    // Calculate time based on position, rounded to 15 minute intervals
    const minutes = roundToNearestFifteenMinutes(Math.floor(y));
    const hours = startHour + Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    // Format time string
    const timeString = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    const currentDate = weekDays[dayIndex];
    
    // Update ghost position
    const eventDuration = dragState.event.end.getTime() - dragState.event.start.getTime();
    const durationMinutes = eventDuration / (1000 * 60);
    
    setDragState(prev => ({
      ...prev,
      ghostPosition: { 
        top: minutes, 
        height: durationMinutes,
        dayIndex
      },
      currentTime: timeString,
      currentDate
    }));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent, dayIndex: number) => {
    if (!dayColumnRefs.current[dayIndex]) return;
    
    // Check if we're leaving the column entirely
    const rect = dayColumnRefs.current[dayIndex]!.getBoundingClientRect();
    if (
      e.clientX < rect.left || 
      e.clientX > rect.right || 
      e.clientY < rect.top || 
      e.clientY > rect.bottom
    ) {
      // Only clear ghost if we're not entering another day column
      // Type check properly to make sure we can use closest
      const relatedTarget = e.relatedTarget as Element | null;
      const isDayColumn = relatedTarget && relatedTarget.closest('.day-column');
      const isSameDayColumn = isDayColumn && relatedTarget.closest('.day-column') === dayColumnRefs.current[dayIndex];
      
      if (!isDayColumn || isSameDayColumn) {
        setDragState(prev => ({
          ...prev,
          ghostPosition: null
        }));
      }
    }
  };

  const handleDrop = async (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    
    if (
      !dayColumnRefs.current[dayIndex] || 
      !dragState.ghostPosition || 
      !dragState.event || 
      !dragState.currentDate
    ) return;
    
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
      const newStart = new Date(dragState.currentDate);
      newStart.setHours(hours, minutes, 0, 0);
      
      // Calculate new end time based on the duration of the original event
      const duration = droppedEvent.end.getTime() - droppedEvent.start.getTime();
      const newEnd = new Date(newStart.getTime() + duration);
      
      // Immediately update local display events to remove the visual "ghost"
      setDisplayEvents(prev => 
        prev.map(event => {
          if (event.id === eventId) {
            return {
              ...event,
              start: newStart,
              end: newEnd
            };
          }
          return event;
        })
      );
      
      // Call the callback to update the event
      if (onEventDrop) {
        onEventDrop(droppedEvent, newStart, newEnd);
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
        currentDate: null,
        event: null,
        startY: 0,
        startDayIndex: 0
      });
    }
  };

  const handleEventDragStart = (event: CalendarEvent) => {
    // Find which day the event belongs to
    const eventDate = event.start;
    const dayIndex = weekDays.findIndex(day => 
      day.getDate() === eventDate.getDate() && 
      day.getMonth() === eventDate.getMonth() && 
      day.getFullYear() === eventDate.getFullYear()
    );

    setDragState({
      isActive: true,
      ghostPosition: null,
      currentTime: '',
      currentDate: null,
      event: event,
      startY: 0,
      startDayIndex: dayIndex !== -1 ? dayIndex : 0
    });
  };

  const handleCalendarClick = (e: React.MouseEvent) => {
    // Only reset if clicking directly on the calendar, not on an event
    if (e.target === e.currentTarget) {
      // No drag state to reset
    }
  };

  const processedEvents = processOverlappingEvents(displayEvents);

  const hasHolidayEvents = weekDays.some(day => 
    getHolidayEventsForDate(events, day).length > 0
  );

  return (
    <div className="h-full calendar-view week-view">
      <div className="calendar-header grid grid-cols-[4rem_repeat(7,1fr)] border-b border-border sticky top-0 z-20 bg-background">
        <div className="border-r border-border h-12"></div>
        
        {weekDays.map((day, index) => (
          <div key={`header-${index}`} className="border-r last:border-r-0 border-border">
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
      
      <div className="calendar-body grid grid-cols-[4rem_repeat(7,1fr)]" onClick={handleCalendarClick}>
        <TimeColumn startHour={startHour} totalHours={totalHours} />
        
        {weekDays.map((day, dayIndex) => {
          const isCurrentDay = isToday(day);
          const dayFormatted = format(day, 'yyyy-MM-dd');
          
          return (
            <div 
              key={`day-${dayIndex}`}
              ref={el => dayColumnRefs.current[dayIndex] = el}
              className="relative border-r last:border-r-0 border-border day-column"
              style={{ height: `${calendarHeight}px` }}
              onDragOver={(e) => handleDragOver(e, dayIndex)}
              onDragEnter={handleDragEnter}
              onDragLeave={(e) => handleDragLeave(e, dayIndex)}
              onDrop={(e) => handleDrop(e, dayIndex)}
            >
              {Array.from({ length: totalHours + 1 }).map((_, index) => (
                <div 
                  key={`grid-${dayIndex}-${index}`}
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
              ))}
              
              {isCurrentDay && (() => {
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
              })()}
              
              {processedEvents.map(({ event, slotIndex, totalSlots }) => {
                const dayDate = weekDays[dayIndex];
                const isSameDate = 
                  dayDate.getDate() === event.start.getDate() &&
                  dayDate.getMonth() === event.start.getMonth() &&
                  dayDate.getFullYear() === event.start.getFullYear();
                
                if (!isSameDate) return null;
                
                const eventHour = event.start.getHours();
                const eventMinute = event.start.getMinutes();
                
                if (eventHour < startHour || eventHour >= endHour) return null;
                
                const top = (eventHour - startHour) * 60 + eventMinute;
                const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
                const height = Math.max(durationMinutes, 15);
                
                // Generate a truly unique key that includes the date to prevent duplicate keys
                const uniqueEventKey = `event-${event.id}-${dayFormatted}`;
                
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
          );
        })}
      </div>
      
      {/* Fixed positioning drop indicator at bottom center of screen */}
      {dragState.isActive && dragState.currentDate && (
        <div 
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-secondary text-secondary-foreground px-4 py-2 rounded-md shadow-lg z-50 font-medium"
        >
          {dragState.currentDate && dragState.currentTime ? (
            <>
              Drop to reschedule: {format(dragState.currentDate, 'EEE, MMM d')} at {dragState.currentTime}
            </>
          ) : (
            <>Drag to reschedule appointment</>
          )}
        </div>
      )}
    </div>
  );
};
