import React, { useState } from 'react';
import { format, addDays, startOfWeek, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
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

  const processOverlappingEvents = (events: CalendarEvent[]) => {
    const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());
    
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
    
    return results;
  };

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

  const handleDragEnd = (e: React.DragEvent, droppedDay: Date) => {
    if (!draggingEvent) return;
    
    const container = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - container.top;
    
    const totalMinutes = Math.floor(y);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.floor(totalMinutes % 60 / 15) * 15;
    
    const newStart = new Date(droppedDay);
    newStart.setHours(hours, minutes, 0, 0);
    
    const duration = draggingEvent.end.getTime() - draggingEvent.start.getTime();
    const newEnd = new Date(newStart.getTime() + duration);

    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
    setDragPreview(null);
  };

  return (
    <div className="flex flex-col h-full border border-border rounded-md overflow-hidden bg-background">
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
          {weekDays.map((day, dayIndex) => {
            const dayEvents = filterEventsByDate(events, day);
            const processedEvents = processOverlappingEvents(dayEvents);
            
            return (
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
                      draggable={event.status !== 'lunch-break'}
                      onDragStart={() => handleDragStart(event)}
                      className="absolute w-full"
                      style={{ 
                        top: `${top}px`, 
                        height: `${height}px`,
                        padding: 0 // Remove any padding that might be creating gaps
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
                    className="absolute left-0 right-0 pointer-events-none z-50"
                    style={{ top: `${dragPreview.top}px` }}
                  >
                    <div className="bg-primary/70 border-2 border-primary text-white font-medium rounded px-3 py-1.5 text-sm inline-block shadow-md">
                      Drop to schedule at {dragPreview.time}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
