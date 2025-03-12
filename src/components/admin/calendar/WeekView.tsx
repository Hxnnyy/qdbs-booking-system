import React, { useState, useEffect } from 'react';
import { format, addDays, isSameDay, isToday, startOfWeek } from 'date-fns';
import { CalendarEvent, CalendarViewProps, DragPreview } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { filterEventsByDateRange } from '@/utils/calendarUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { HolidayIndicator } from './HolidayIndicator';
import { useCalendarScroll } from '@/hooks/useCalendarScroll';

export const WeekView: React.FC<CalendarViewProps> = ({
  date,
  onDateChange,
  events,
  onEventDrop,
  onEventClick
}) => {
  const { startHour, endHour } = useCalendarSettings();
  const { scrollContainerRef } = useCalendarScroll();
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [dragPreview, setDragPreview] = useState<DragPreview | null>(null);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  const totalHours = endHour - startHour;
  
  const calendarHeight = totalHours * 60;
  
  const weekStart = startOfWeek(date, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const weekHolidayEvents = weekDays.map(day => {
    return events.filter(event => 
      event.allDay === true && 
      isSameDay(event.start, day)
    );
  });

  const processEventsForDay = (dayEvents: CalendarEvent[]) => {
    const lunchBreaks = dayEvents.filter(event => event.status === 'lunch-break');
    const otherEvents = dayEvents.filter(event => event.status !== 'lunch-break');
    
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
      
      let slotOffset = 0;
      
      Object.values(barberGroups).forEach(barberGroup => {
        const sortedBarberGroup = barberGroup.sort((a, b) => a.start.getTime() - b.start.getTime());
        const barberTotalSlots = Object.keys(barberGroups).length;
        
        sortedBarberGroup.forEach((event) => {
          results.push({
            event,
            slotIndex: slotOffset,
            totalSlots: barberTotalSlots
          });
        });
        
        slotOffset += 1;
      });
    });
    
    lunchBreaks.forEach(lunchEvent => {
      results.push({
        event: lunchEvent,
        slotIndex: 0, 
        totalSlots: 1
      });
    });
    
    return results;
  };

  useEffect(() => {
    const startDate = weekDays[0];
    const endDate = weekDays[6];
    const filtered = filterEventsByDateRange(events, startDate, endDate);
    setDisplayEvents(filtered);
  }, [events, date]);

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

  const eventsByDay = weekDays.map(day => {
    const dayEvents = displayEvents.filter(event => 
      isSameDay(event.start, day)
    );
    return processEventsForDay(dayEvents);
  });

  return (
    <div className="flex flex-col h-full border border-border rounded-md overflow-hidden bg-background">
      <div className="grid grid-cols-[4rem_repeat(7,1fr)] border-b border-border">
        <div className="border-r border-border h-12"></div>
        
        {weekDays.map((day, index) => (
          <div 
            key={`header-${index}`} 
            className={`flex flex-col border-r border-border last:border-r-0 ${isToday(day) ? 'bg-primary/10' : ''}`}
          >
            <div className="h-12 flex flex-col items-center justify-center">
              <div className="text-sm">{format(day, 'EEE')}</div>
              <div className="text-xs text-muted-foreground">{format(day, 'd')}</div>
            </div>
            
            <HolidayIndicator holidayEvents={weekHolidayEvents[index]} />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-[4rem_repeat(7,1fr)] flex-1 overflow-hidden">
        <div className="relative border-r border-border overflow-hidden">
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
        
        <div className="col-span-7 overflow-auto" ref={scrollContainerRef}>
          <div className="grid grid-cols-7 h-full relative" style={{ height: `${calendarHeight}px` }}>
            {weekDays.map((day, dayIndex) => (
              <div 
                key={`day-${dayIndex}`}
                className={`relative border-r border-border last:border-r-0 ${isToday(day) ? 'bg-primary/5' : ''}`}
                onDragOver={(e) => handleDragOver(e, dayIndex)}
                onDrop={(e) => handleDragEnd(e, dayIndex)}
                onDragLeave={() => setDragPreview(null)}
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
                
                {isToday(day) && (() => {
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
                
                {eventsByDay[dayIndex].map(({ event, slotIndex, totalSlots }) => {
                  const eventHour = event.start.getHours();
                  const eventMinute = event.start.getMinutes();
                  
                  if (eventHour < startHour || eventHour >= endHour) return null;
                  
                  const top = (eventHour - startHour) * 60 + eventMinute;
                  const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
                  const height = Math.max(durationMinutes, 15);
                  
                  return (
                    <div 
                      key={event.id}
                      draggable={event.status !== 'lunch-break'}
                      onDragStart={() => handleDragStart(event)}
                      className="absolute"
                      style={{ 
                        top: `${top}px`, 
                        height: `${height}px`,
                        left: 0,
                        right: 0,
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
            ))}
          </div>
        </div>
      </div>
      
      {dragPreview && (
        <div 
          className="absolute pointer-events-none z-50 grid grid-cols-[4rem_repeat(7,1fr)]"
          style={{ top: `${dragPreview.top}px` }}
        >
          <div></div>
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={`preview-${index}`} className="relative">
              {index === dragPreview.columnIndex && (
                <div className="bg-primary/70 border-2 border-primary text-white font-medium rounded px-3 py-1.5 text-sm inline-block shadow-md">
                  Drop to schedule at {dragPreview.time}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
