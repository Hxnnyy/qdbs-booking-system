
import React, { useEffect, useState } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps, DragPreview } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { filterEventsByWeek, getHolidayEventsForDate } from '@/utils/calendarUtils';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { HolidayIndicator } from './HolidayIndicator';

export const WeekView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const { startHour, endHour } = useCalendarSettings();
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const totalHours = endHour - startHour;
  const calendarHeight = totalHours * 60;

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
      const barberGroups: Record<string, CalendarEvent[]> = {};
      
      group.forEach(event => {
        if (!barberGroups[event.barberId]) {
          barberGroups[event.barberId] = [];
        }
        barberGroups[event.barberId].push(event);
      });
      
      if (Object.keys(barberGroups).length > 1) {
        let slotOffset = 0;
        
        Object.values(barberGroups).forEach(barberGroup => {
          const sortedBarberGroup = barberGroup.sort((a, b) => a.start.getTime() - b.start.getTime());
          const barberTotalSlots = group.length;
          
          sortedBarberGroup.forEach((event, index) => {
            results.push({
              event,
              slotIndex: slotOffset + index,
              totalSlots: barberTotalSlots
            });
          });
          
          slotOffset += barberGroup.length;
        });
      } else {
        const sortedGroup = group.sort((a, b) => a.start.getTime() - b.start.getTime());
        const totalSlots = sortedGroup.length;
        
        sortedGroup.forEach((event, index) => {
          results.push({
            event,
            slotIndex: index,
            totalSlots
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

  useEffect(() => {
    const filtered = filterEventsByWeek(events, date);
    setDisplayEvents(filtered);
  }, [events, date]);

  const handleDragStart = (event: CalendarEvent) => {
    if (event.status === 'lunch-break') return;
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
    <div className="flex flex-col h-full border border-border rounded-md overflow-hidden bg-background">
      {/* Header grid - now with 8 columns (time column + 7 days) */}
      <div className="grid grid-cols-[4rem_repeat(7,1fr)] border-b border-border">
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
              <div className="h-12 flex flex-col items-center justify-center">
                <div className="text-sm">{format(day, 'EEE')}</div>
                <div className="text-xs text-muted-foreground">{format(day, 'd')}</div>
              </div>
              
              {/* Holiday Indicator */}
              <HolidayIndicator holidayEvents={holidayEvents} />
            </div>
          );
        })}
      </div>
      
      {/* Main grid - now with 8 columns */}
      <div className="grid grid-cols-[4rem_repeat(7,1fr)] flex-1">
        {/* Time column */}
        <div className="relative border-r border-border">
          <div className="absolute top-0 left-0 bottom-0 w-full z-10 bg-background">
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
        </div>
        
        {/* Day columns */}
        {weekDays.map((day, dayIndex) => (
          <div 
            key={dayIndex}
            className="relative border-r last:border-r-0 border-border"
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
                    draggable={event.status !== 'lunch-break'}
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
        ))}
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
