
import React, { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps, DragPreview } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { filterEventsByWeek } from '@/utils/eventFilterUtils';
import { getHolidayEventsForDate } from '@/utils/holidayIndicatorUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { processOverlappingEvents } from '@/utils/processOverlappingEvents';
import { TimeColumn } from './TimeColumn';
import { DayHeader } from './DayHeader';
import { HolidayIndicator } from './HolidayIndicator';

export const WeekView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const { startHour, endHour, autoScrollToCurrentTime } = useCalendarSettings();
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const totalHours = endHour - startHour;
  const calendarHeight = totalHours * 60;

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

  const handleDragStart = (event: CalendarEvent) => {
    if (event.status === 'lunch-break' || event.status === 'holiday') return;
    // Create a deep copy of the event to prevent reference issues
    setDraggingEvent({...event});
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.floor(totalMinutes % 60 / 15) * 15;
    
    const previewTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'pm' : 'am'}`;
    setDragPreview({ 
      time: previewTime, 
      top: Math.floor(totalMinutes / 15) * 15,
      columnIndex: dayIndex
    });
  };

  const handleDragEnd = (e: React.DragEvent, dayIndex: number) => {
    if (!draggingEvent) return;
    
    const selectedDate = weekDays[dayIndex];
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.floor(totalMinutes % 60 / 15) * 15;
    
    const newStart = new Date(selectedDate);
    newStart.setHours(hours, minutes, 0, 0);
    
    const duration = draggingEvent.end.getTime() - draggingEvent.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    console.log('Drop event:', {
      event: draggingEvent.title,
      oldStart: draggingEvent.start.toISOString(),
      newStart: newStart.toISOString(),
      dayIndex,
      selectedDate: selectedDate.toISOString()
    });

    // Store the event ID before clearing dragging state
    const eventId = draggingEvent.id;
    
    // Clear drag states immediately to prevent UI issues
    setDraggingEvent(null);
    setDragPreview(null);
    
    // Remove the event from display events immediately to prevent duplication
    setDisplayEvents(prev => prev.filter(e => e.id !== eventId));
    
    // Call the actual event handler
    onEventDrop(draggingEvent, newStart, newEnd);
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
        
        {weekDays.map((day, dayIndex) => {
          const isCurrentDay = isToday(day);
          
          return (
            <div 
              key={dayIndex}
              className="relative border-r last:border-r-0 border-border day-column"
              style={{ height: `${calendarHeight}px` }}
              onDragOver={(e) => handleDragOver(e, dayIndex)}
              onDrop={(e) => handleDragEnd(e, dayIndex)}
              onDragLeave={() => setDragPreview(null)}
            >
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
                
                return (
                  <div 
                    key={`${event.id}-${dayIndex}`}
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
          );
        })}
      </div>
      
      {dragPreview && dragPreview.columnIndex !== undefined && (
        <div 
          className="absolute left-0 top-0 pointer-events-none z-50 w-full h-full"
          style={{
            gridColumnStart: dragPreview.columnIndex + 2,
            gridColumnEnd: dragPreview.columnIndex + 3,
          }}
        >
          <div 
            className="bg-primary/70 border-2 border-primary text-white font-medium rounded px-3 py-1.5 text-sm inline-block shadow-md absolute"
            style={{
              top: `${dragPreview.top}px`,
              left: '50%',
              transform: 'translateX(-50%)'
            }}
          >
            Drop to schedule at {dragPreview.time}
          </div>
        </div>
      )}
    </div>
  );
};
