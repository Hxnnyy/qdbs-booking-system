
import React, { useEffect, useState } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps, DragPreview } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { filterEventsByWeek } from '@/utils/eventFilterUtils';
import { getHolidayEventsForDate } from '@/utils/holidayIndicatorUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
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

  const processOverlappingEvents = (events: CalendarEvent[]) => {
    // First, separate lunch breaks and holidays from other events
    const lunchBreaks = events.filter(event => event.status === 'lunch-break');
    const holidays = events.filter(event => event.status === 'holiday');
    const otherEvents = events.filter(event => event.status !== 'lunch-break' && event.status !== 'holiday');
    
    // Process regular events (non-lunch-breaks, non-holidays)
    const sortedEvents = [...otherEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
    
    const overlappingGroups: CalendarEvent[][] = [];
    
    sortedEvents.forEach(event => {
      const overlappingGroupIndex = overlappingGroups.findIndex(group => 
        group.some(existingEvent => {
          return (
            (event.start < existingEvent.end && event.end > existingEvent.start) || 
            (existingEvent.start < event.end && existingEvent.end > event.start)
          );
        })
      );
      
      if (overlappingGroupIndex >= 0) {
        overlappingGroups[overlappingGroupIndex].push(event);
      } else {
        overlappingGroups.push([event]);
      }
    });
    
    const results: Array<{event: CalendarEvent, slotIndex: number, totalSlots: number}> = [];
    
    overlappingGroups.forEach(group => {
      // Calculate the actual overlaps
      const actualOverlaps = calculateActualOverlaps(group);
      const totalSlots = Math.max(1, actualOverlaps);
      
      // Only apply slot divisions if there are actual overlapping events
      if (group.length > 1 && actualOverlaps > 1) {
        // Use barberGroups to group events by barber
        const barberGroups: Record<string, CalendarEvent[]> = {};
        
        group.forEach(event => {
          if (!barberGroups[event.barberId]) {
            barberGroups[event.barberId] = [];
          }
          barberGroups[event.barberId].push(event);
        });
        
        let slotOffset = 0;
        
        Object.values(barberGroups).forEach(barberGroup => {
          const sortedBarberGroup = barberGroup.sort((a, b) => a.start.getTime() - b.start.getTime());
          
          sortedBarberGroup.forEach((event, index) => {
            results.push({
              event,
              slotIndex: slotOffset + index,
              totalSlots: totalSlots
            });
          });
          
          slotOffset += barberGroup.length;
        });
      } else {
        // If there's only one event or no overlap, use full width
        group.forEach(event => {
          results.push({
            event,
            slotIndex: 0, // Always use index 0 for non-overlapping events
            totalSlots: 1  // Always use full width for non-overlapping events
          });
        });
      }
    });
    
    // Process lunch breaks separately - always give them full width
    lunchBreaks.forEach(lunchEvent => {
      results.push({
        event: lunchEvent,
        slotIndex: 0, 
        totalSlots: 1  // Always use full width for lunch breaks
      });
    });
    
    // Process holidays separately - always give them full width
    holidays.forEach(holidayEvent => {
      results.push({
        event: holidayEvent,
        slotIndex: 0, 
        totalSlots: 1  // Always use full width for holidays
      });
    });
    
    return results;
  };

  // Helper function to calculate actual overlaps
  const calculateActualOverlaps = (events: CalendarEvent[]) => {
    if (events.length <= 1) return 1;
    
    let maxConcurrent = 1;
    
    for (let i = 0; i < events.length; i++) {
      let concurrent = 1;
      const currentEvent = events[i];
      
      for (let j = 0; j < events.length; j++) {
        if (i === j) continue;
        
        const otherEvent = events[j];
        if (
          (currentEvent.start < otherEvent.end && currentEvent.end > otherEvent.start) || 
          (otherEvent.start < currentEvent.end && otherEvent.end > currentEvent.start)
        ) {
          concurrent++;
        }
      }
      
      maxConcurrent = Math.max(maxConcurrent, concurrent);
    }
    
    return maxConcurrent;
  };

  useEffect(() => {
    const filtered = filterEventsByWeek(events, date);
    setDisplayEvents(filtered);
  }, [events, date]);

  useEffect(() => {
    // Only scroll to current time if autoScrollToCurrentTime is enabled
    if (!autoScrollToCurrentTime) return;
    
    // Scroll to current time on initial load
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
            // Scroll to current time minus some offset to show context
            container.scrollTop = position - 100;
          }
        }, 100);
      }
    }
  }, [date, weekDays, startHour, endHour, autoScrollToCurrentTime]);

  const handleDragStart = (event: CalendarEvent) => {
    if (event.status === 'lunch-break' || event.status === 'holiday') return;
    setDraggingEvent(event);
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
    
    // Get the day for this column
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

    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
    setDragPreview(null);
  };

  const processedEvents = processOverlappingEvents(displayEvents);

  return (
    <div className="h-full calendar-view week-view">
      {/* Header grid - Fixed at the top */}
      <div className="calendar-header grid grid-cols-[4rem_repeat(7,1fr)] border-b border-border sticky top-0 z-20 bg-background">
        {/* Empty cell for time column */}
        <div className="border-r border-border h-12"></div>
        
        {/* Day headers */}
        {weekDays.map((day, index) => {
          // Get holiday events for this day
          const dayDate = addDays(weekStart, index);
          const holidayEvents = getHolidayEventsForDate(events, dayDate);
          
          return (
            <div 
              key={index} 
              className={`flex flex-col border-r last:border-r-0 border-border ${
                isToday(day) ? 'bg-primary/10' : ''
              }`}
            >
              {/* Holiday Indicator - Moved above the day/date row */}
              <HolidayIndicator holidayEvents={holidayEvents} />
              
              <div className="h-12 flex flex-col items-center justify-center">
                <div className="text-sm">{format(day, 'EEE')}</div>
                <div className="text-xs text-muted-foreground">{format(day, 'd')}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Main grid - Scrollable content */}
      <div className="calendar-body grid grid-cols-[4rem_repeat(7,1fr)]">
        {/* Time column */}
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
        
        {/* Day columns */}
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
                
                {/* Current time indicator */}
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
                  // Calculate the correct day to display events properly
                  const eventDate = event.start;
                  const eventDay = weekDays.findIndex(day => 
                    day.getDate() === eventDate.getDate() &&
                    day.getMonth() === eventDate.getMonth() &&
                    day.getFullYear() === eventDate.getFullYear()
                  );
                  
                  if (eventDay !== dayIndex) return null;
                  
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
            </div>
          );
        })}
      </div>
      
      {/* Drag preview */}
      {dragPreview && dragPreview.columnIndex !== undefined && (
        <div 
          className="absolute left-0 top-0 pointer-events-none z-50 w-full h-full"
          style={{
            gridColumnStart: dragPreview.columnIndex + 2, // +2 because we now have a time column
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
