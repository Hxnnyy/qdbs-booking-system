import React, { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { filterEventsByDate, getHolidayEventsForDate } from '@/utils/calendarUtils';
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

  // Check if there are any holiday events for this day
  const holidayEvents = getHolidayEventsForDate(events, date);

  // For debugging
  console.log("DayView - Date:", format(date, 'yyyy-MM-dd'));
  console.log("DayView - Holiday events:", holidayEvents);

  const processOverlappingEvents = (events: CalendarEvent[]) => {
    // First, separate lunch breaks from other events
    const lunchBreaks = events.filter(event => event.status === 'lunch-break');
    const otherEvents = events.filter(event => event.status !== 'lunch-break');
    
    // Process regular events (non-lunch-breaks)
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
      // Fix for appointment card size issue - prevent creating unnecessary separate groups
      // Check if it's March 14th, 2025
      const isMarch14 = group.some(event => {
        const eventDate = event.start;
        return eventDate.getDate() === 14 && eventDate.getMonth() === 2 && eventDate.getFullYear() === 2025;
      });
      
      // Special handling for all days to ensure proper sizing
      const barberGroups: Record<string, CalendarEvent[]> = {};
      
      group.forEach(event => {
        if (!barberGroups[event.barberId]) {
          barberGroups[event.barberId] = [];
        }
        barberGroups[event.barberId].push(event);
      });
      
      // Calculate the total slots based on actual overlaps, not just by barber
      // This fixes the issue with appointments showing as half-width when alone
      const actualOverlaps = calculateActualOverlaps(group);
      const totalSlots = Math.max(1, actualOverlaps);
      
      if (Object.keys(barberGroups).length > 1 && actualOverlaps > 1) {
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
        // If there's no actual overlap, use full width regardless of barber
        const sortedGroup = group.sort((a, b) => a.start.getTime() - b.start.getTime());
        
        sortedGroup.forEach((event, index) => {
          results.push({
            event,
            slotIndex: 0, // Always use index 0 for non-overlapping events
            totalSlots: 1  // Always use full width for non-overlapping events
          });
        });
      }
    });
    
    // Process lunch breaks separately - always give them full width regardless of any holiday
    lunchBreaks.forEach(lunchEvent => {
      results.push({
        event: lunchEvent,
        slotIndex: 0, 
        totalSlots: 1  // Always use full width for lunch breaks
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
    const filtered = filterEventsByDate(events, date);
    setDisplayEvents(filtered);
  }, [events, date]);

  useEffect(() => {
    // Scroll to current time on initial load if today is displayed and autoScroll is enabled
    if (isToday(date) && autoScrollToCurrentTime) {
      const now = new Date();
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
      {/* Header for the day - Fixed at the top */}
      <div className="calendar-header grid grid-cols-[4rem_1fr] border-b border-border sticky top-0 z-20 bg-background">
        {/* Empty cell for time column */}
        <div className="border-r border-border h-12"></div>
        
        {/* Day header */}
        <div className={`flex flex-col ${isToday(date) ? 'bg-primary/10' : ''}`}>
          <div className="h-12 flex flex-col items-center justify-center">
            <div className="text-sm">{format(date, 'EEEE')}</div>
            <div className="text-xs text-muted-foreground">{format(date, 'MMMM d')}</div>
          </div>
          
          {/* Holiday Indicator */}
          <HolidayIndicator holidayEvents={holidayEvents} />
        </div>
      </div>
      
      {/* Main grid with time column and day column - Scrollable content */}
      <div className="calendar-body grid grid-cols-[4rem_1fr]">
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
        
        {/* Day column */}
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
      
      {/* Drag preview */}
      {dragPreview && (
        <div 
          className="absolute pointer-events-none z-50 grid grid-cols-[4rem_1fr]"
          style={{ top: `${dragPreview.top}px` }}
        >
          <div></div> {/* Empty cell for time column */}
          <div className="bg-primary/70 border-2 border-primary text-white font-medium rounded px-3 py-1.5 text-sm inline-block shadow-md">
            Drop to schedule at {dragPreview.time}
          </div>
        </div>
      )}
    </div>
  );
};
