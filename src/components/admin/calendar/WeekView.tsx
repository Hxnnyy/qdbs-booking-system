
import React, { useEffect, useState } from 'react';
import { addDays, startOfWeek } from 'date-fns';
import { CalendarEvent, CalendarViewProps, DragPreview } from '@/types/calendar';
import { filterEventsByWeek } from '@/utils/calendarUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { WeekDayHeader } from './WeekDayHeader';
import { TimeMarkers } from './TimeMarkers';
import { DayColumn } from './DayColumn';
import { DragPreviewOverlay } from './DragPreviewOverlay';
import { processOverlappingEvents } from '@/utils/eventOverlapUtils';

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

  useEffect(() => {
    const filtered = filterEventsByWeek(events, date);
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

  const handleDragEnd = (e: React.DragEvent) => {
    if (!draggingEvent || !dragPreview?.columnIndex) return;
    
    const dayIndex = dragPreview.columnIndex;
    const selectedDate = addDays(weekStart, dayIndex);
    
    const totalMinutes = Math.floor(e.clientY - e.currentTarget.getBoundingClientRect().top);
    const hours = Math.floor(totalMinutes / 60) + startHour;
    const minutes = Math.floor(totalMinutes % 60 / 15) * 15;
    
    const newStart = new Date(selectedDate);
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
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b border-border">
        <div className="border-r border-border w-16 flex-shrink-0"></div>
        
        {weekDays.map((day, index) => (
          <WeekDayHeader 
            key={index}
            day={day}
            index={index}
            displayEvents={displayEvents}
            weekStart={weekStart}
          />
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="flex-1 relative overflow-y-auto">
        <div className="grid grid-cols-8 h-full">
          {/* Time markers column */}
          <div className="w-16 flex-shrink-0">
            <TimeMarkers startHour={startHour} totalHours={totalHours} />
          </div>
          
          {/* Day columns */}
          {weekDays.map((_, dayIndex) => (
            <DayColumn
              key={dayIndex}
              dayIndex={dayIndex}
              startHour={startHour}
              totalHours={totalHours}
              processedEvents={processedEvents}
              handleDragOver={handleDragOver}
              handleDragEnd={handleDragEnd}
              handleDragStart={handleDragStart}
              draggingEvent={draggingEvent}
              calendarHeight={calendarHeight}
              onEventClick={onEventClick}
            />
          ))}
        </div>
      </div>
      
      {/* Drag preview overlay */}
      <DragPreviewOverlay dragPreview={dragPreview} />
    </div>
  );
};
