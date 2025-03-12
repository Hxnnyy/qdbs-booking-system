import React, { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { filterEventsByDate } from '@/utils/calendarUtils';
import { getHolidayEventsForDate } from '@/utils/holidayIndicatorUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { HolidayIndicator } from './HolidayIndicator';

export const DayView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const { startHour, endHour, autoScrollToCurrentTime } = useCalendarSettings();
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  const [dragPreview, setDragPreview] = useState<{ time: string, top: number } | null>(null);
  const totalHours = endHour - startHour;
  
  const calendarHeight = totalHours * 60;

  const holidayEvents = getHolidayEventsForDate(events, date);

  console.log("DayView - Date:", format(date, 'yyyy-MM-dd'));
  console.log("DayView - Holiday events:", holidayEvents);

  const processOverlappingEvents = (events: CalendarEvent[]) => {
    const holidays = events.filter(event => event.status === 'holiday');
    const nonHolidayEvents = events.filter(event => event.status !== 'holiday');
    
    const timeSlots: Record<string, CalendarEvent[]> = {};
    
    nonHolidayEvents.forEach(event => {
      const startTime = event.start.getTime();
      if (!timeSlots[startTime]) {
        timeSlots[startTime] = [];
      }
      timeSlots[startTime].push(event);
    });
    
    const results: Array<{event: CalendarEvent, slotIndex: number, totalSlots: number}> = [];
    
    Object.values(timeSlots).forEach(slotEvents => {
      const appointments = slotEvents.filter(event => event.status !== 'lunch-break');
      const lunchBreaks = slotEvents.filter(event => event.status === 'lunch-break');
      
      const totalSlots = Math.max(1, appointments.length + lunchBreaks.length);
      
      appointments.forEach((event, index) => {
        results.push({
          event,
          slotIndex: index,
          totalSlots
        });
      });
      
      lunchBreaks.forEach((event, index) => {
        results.push({
          event,
          slotIndex: appointments.length + index,
          totalSlots
        });
      });
    });
    
    holidays.forEach(holidayEvent => {
      results.push({
        event: holidayEvent,
        slotIndex: 0,
        totalSlots: 1
      });
    });
    
    return results;
  };

  useEffect(() => {
    const filtered = filterEventsByDate(events, date);
    setDisplayEvents(filtered);
  }, [events, date]);

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

  const handleDragStart = (event: CalendarEvent) => {
    if (event.status === 'lunch-break' || event.status === 'holiday') return;
    setDraggingEvent(event);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.floor(totalMinutes % 60 / 15) * 15;
    
    const previewTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'pm' : 'am'}`;
    setDragPreview({ time: previewTime, top: Math.floor(totalMinutes / 15) * 15 });
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.floor(totalMinutes % 60 / 15) * 15;
    
    const newStart = new Date(date);
    newStart.setHours(hours, minutes, 0, 0);
    
    const duration = draggingEvent.end.getTime() - draggingEvent.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    console.log('Day view drop event:', {
      event: draggingEvent.title,
      oldStart: draggingEvent.start.toISOString(),
      newStart: newStart.toISOString()
    });

    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
    setDragPreview(null);
  };

  const processedEvents = processOverlappingEvents(displayEvents);

  return (
    <div className="h-full calendar-view day-view">
      <div className="calendar-header grid grid-cols-[4rem_1fr] border-b border-border sticky top-0 z-20 bg-background">
        <div className="border-r border-border h-12"></div>
        <div className={`flex flex-col ${isToday(date) ? 'bg-primary/10' : ''}`}>
          <div className="h-12 flex flex-col items-center justify-center">
            <div className="text-sm">{format(date, 'EEEE')}</div>
            <div className="text-xs text-muted-foreground">{format(date, 'MMMM d')}</div>
          </div>
          <HolidayIndicator holidayEvents={holidayEvents} />
        </div>
      </div>
      <div className="calendar-body grid grid-cols-[4rem_1fr]">
        <div className="time-column border-r border-border">
          {Array.from({ length: totalHours + 1 }).map((_, index) => {
            const hour = startHour + index;
            return (
              <div 
                key={`time-${hour}`}
                className="h-[60px] flex items-center justify-end pr-2 text-xs text-muted-foreground"
              >
                {hour % 12 === 0 ? '12' : hour % 12}{hour < 12 ? 'am' : 'pm'}
              </div>
            );
          })}
        </div>
        <div 
          className="relative day-column"
          style={{ height: `${calendarHeight}px` }}
          onDragOver={handleDragOver}
          onDrop={handleDragEnd}
          onDragLeave={() => setDragPreview(null)}
        >
          <div className="absolute top-0 left-0 right-0 bottom-0">
            {Array.from({ length: totalHours + 1 }).map((_, index) => (
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
            ))}
            
            {isToday(date) && (() => {
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
              const eventHour = event.start.getHours();
              const eventMinute = event.start.getMinutes();
              
              if (eventHour < startHour || eventHour >= endHour) return null;
              
              const top = (eventHour - startHour) * 60 + eventMinute;
              const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
              const height = Math.max(durationMinutes, 15);
              
              return (
                <div 
                  key={event.id}
                  draggable={event.status !== 'lunch-break' && event.status !== 'holiday'}
                  onDragStart={() => handleDragStart(event)}
                  className="absolute w-full"
                  style={{ 
                    top: `${top}px`, 
                    height: `${height}px`,
                    padding: 0
                  }}
                >
                  <CalendarEventComponent 
                    event={event} 
                    onEventClick={onEventClick}
                    isDragging={draggingEvent?.id === event.id}
                    slotIndex={slotIndex}
                    totalSlots={totalSlots}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {dragPreview && (
        <div 
          className="absolute pointer-events-none z-50 grid grid-cols-[4rem_1fr]"
          style={{ top: `${dragPreview.top}px` }}
        >
          <div></div>
          <div className="bg-primary/70 border-2 border-primary text-white font-medium rounded px-3 py-1.5 text-sm inline-block shadow-md">
            Drop to schedule at {dragPreview.time}
          </div>
        </div>
      )}
    </div>
  );
};
