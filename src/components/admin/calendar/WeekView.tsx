import React, { useState } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEventComponent } from './CalendarEvent';
import { filterEventsByDate } from '@/utils/calendarUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';

export const WeekView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const { startHour, endHour } = useCalendarSettings();
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [dragPreview, setDragPreview] = useState<{ time: string, top: number, columnIndex: number } | null>(null);
  const totalHours = endHour - startHour;
  
  const calendarHeight = totalHours * 60;
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, index) => {
    return addDays(weekStart, index);
  });

  const organizeOverlappingEvents = (events: CalendarEvent[]) => {
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
    const slots: { [key: string]: CalendarEvent[][] } = {};

    sortedEvents.forEach(event => {
      const eventHour = event.start.getHours();
      const eventMinute = event.start.getMinutes();
      const timeKey = `${eventHour}:${eventMinute}`;

      if (!slots[timeKey]) {
        slots[timeKey] = [[]];
      }

      let placed = false;
      for (let slotGroup of slots[timeKey]) {
        if (!slotGroup.some(existingEvent => {
          const eventEnd = event.end.getTime();
          const existingEnd = existingEvent.end.getTime();
          return event.start.getTime() < existingEnd && eventEnd > existingEvent.start.getTime();
        })) {
          slotGroup.push(event);
          placed = true;
          break;
        }
      }

      if (!placed) {
        slots[timeKey].push([event]);
      }
    });

    return slots;
  };

  const handleDragStart = (event: CalendarEvent) => {
    setDraggingEvent(event);
  };

  const handleDragOver = (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.round((totalMinutes % 60) / 15) * 15;
    
    const previewTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'pm' : 'am'}`;
    setDragPreview({ time: previewTime, top: y, columnIndex: dayIndex });
  };

  const handleDragEnd = (e: React.DragEvent, droppedDay: Date) => {
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.round((totalMinutes % 60) / 15) * 15;
    
    const newStart = new Date(droppedDay);
    newStart.setHours(hours, minutes, 0, 0);
    
    const duration = draggingEvent.end.getTime() - draggingEvent.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
    setDragPreview(null);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-md overflow-hidden">
      <div className="flex border-b border-border h-12">
        <div className="w-16 border-r border-border"></div>
        {weekDays.map((day) => (
          <div 
            key={day.toISOString()} 
            className={`flex-1 font-medium flex flex-col items-center justify-center min-w-[120px] ${
              isToday(day) ? 'bg-primary/10' : ''
            }`}
          >
            <div className="text-sm">{format(day, 'EEE')}</div>
            <div className="text-xs text-muted-foreground">{format(day, 'd MMM')}</div>
          </div>
        ))}
      </div>
      <div 
        className="flex-1 relative"
        style={{ height: `${calendarHeight}px` }}
      >
        <div className="flex h-full">
          <div className="w-16 relative border-r border-border h-full z-10">
            {Array.from({ length: totalHours + 1 }).map((_, index) => {
              const hour = startHour + index;
              return (
                <div 
                  key={`time-${hour}`}
                  className="absolute h-[60px] flex items-center justify-end pr-2 text-xs text-muted-foreground"
                  style={{ top: `${index * 60}px`, right: 0, width: '100%' }}
                >
                  {hour % 12 === 0 ? '12' : hour % 12}{hour < 12 ? 'am' : 'pm'}
                </div>
              );
            })}
          </div>
          {weekDays.map((day, dayIndex) => (
            <div 
              key={day.toISOString()}
              className="flex-1 relative border-r border-border min-w-[120px] h-full"
              onDragOver={(e) => handleDragOver(e, dayIndex)}
              onDrop={(e) => handleDragEnd(e, day)}
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
                  />
                );
              })()}
              {filterEventsByDate(events, day).map((event) => {
                const eventHour = event.start.getHours();
                const eventMinute = event.start.getMinutes();
                
                if (eventHour < startHour || eventHour >= endHour) return null;
                
                const top = (eventHour - startHour) * 60 + eventMinute;
                const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
                const height = Math.max(durationMinutes, 15);

                const overlappingEvents = filterEventsByDate(events, day).filter(e => {
                  const eventEnd = event.end.getTime();
                  const eEnd = e.end.getTime();
                  return event.start.getTime() < eEnd && eventEnd > e.start.getTime();
                });

                const slotIndex = overlappingEvents.indexOf(event);
                const totalSlots = overlappingEvents.length;

                return (
                  <div 
                    key={event.id}
                    draggable 
                    onDragStart={() => handleDragStart(event)}
                    className="absolute w-full px-1"
                    style={{ 
                      top: `${top}px`, 
                      height: `${height}px`
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
              {dragPreview && dragPreview.columnIndex === dayIndex && (
                <div 
                  className="absolute left-0 right-0 pointer-events-none"
                  style={{ top: `${dragPreview.top}px` }}
                >
                  <div className="bg-primary/20 border border-primary rounded px-2 py-1 text-xs inline-block">
                    Drop to schedule at {dragPreview.time}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
