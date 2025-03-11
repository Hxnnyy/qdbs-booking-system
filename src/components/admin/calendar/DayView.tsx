
import React, { useState, useEffect } from 'react';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { filterEventsByDate } from '@/utils/calendarUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { TimeMarkers } from './TimeMarkers';
import { DayColumnGrid } from './DayColumnGrid';
import { DragPreviewOverlay } from './DragPreviewOverlay';
import { processOverlappingEvents } from '@/utils/eventOverlapUtils';
import { DayHeader } from './DayHeader';
import { HolidayIndicator } from './HolidayIndicator';

export const DayView: React.FC<CalendarViewProps> = ({ 
  date, 
  onDateChange,
  events, 
  onEventDrop,
  onEventClick
}) => {
  const { startHour, endHour } = useCalendarSettings();
  const [draggingEvent, setDraggingEvent] = useState<CalendarEvent | null>(null);
  const [displayEvents, setDisplayEvents] = useState<CalendarEvent[]>([]);
  const [dragPreview, setDragPreview] = useState<{ time: string, top: number } | null>(null);
  const totalHours = endHour - startHour;
  const calendarHeight = totalHours * 60;

  // Check if there are any holiday events for this day
  const holidayEvents = displayEvents.filter(event => 
    event.status === 'holiday' && event.allDay === true
  );

  useEffect(() => {
    const filtered = filterEventsByDate(events, date);
    setDisplayEvents(filtered);
  }, [events, date]);

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

    onEventDrop(draggingEvent, newStart, newEnd);
    setDraggingEvent(null);
    setDragPreview(null);
  };

  const processedEvents = processOverlappingEvents(displayEvents);

  return (
    <div className="flex flex-col h-full border border-border rounded-md overflow-hidden bg-background">
      <div className="flex flex-col">
        <DayHeader date={date} />
        <HolidayIndicator holidayEvents={holidayEvents} />
      </div>
      
      <div 
        className="flex-1 relative"
        style={{ height: `${calendarHeight}px` }}
        onDragOver={handleDragOver}
        onDrop={handleDragEnd}
        onDragLeave={() => setDragPreview(null)}
      >
        <TimeMarkers startHour={startHour} totalHours={totalHours} />
        
        <div className="absolute top-0 left-16 right-0 bottom-0">
          <DayColumnGrid totalHours={totalHours} />
          
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
        
        {dragPreview && (
          <DragPreviewOverlay 
            dragPreview={{ 
              time: dragPreview.time, 
              top: dragPreview.top,
              columnIndex: 0 
            }} 
          />
        )}
      </div>
    </div>
  );
};
