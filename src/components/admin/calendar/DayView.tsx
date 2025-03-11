
import React, { useState, useEffect } from 'react';
import { format, isToday } from 'date-fns';
import { CalendarEvent, CalendarViewProps } from '@/types/calendar';
import { CalendarEvent as CalendarEventComponent } from './CalendarEvent';
import { filterEventsByDate } from '@/utils/calendarUtils';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { TimeMarkers } from './TimeMarkers';
import { DayColumnGrid } from './DayColumnGrid';
import { DragPreviewOverlay } from './DragPreviewOverlay';
import { processOverlappingEvents } from '@/utils/eventOverlapUtils';

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
        <div className={`h-12 border-b border-border font-medium flex flex-col items-center justify-center ${
          isToday(date) ? 'bg-primary/10' : ''
        }`}>
          <div className="text-sm">{format(date, 'EEEE')}</div>
          <div className="text-xs text-muted-foreground">{format(date, 'MMMM d')}</div>
        </div>
        
        {/* Holiday Indicator with Tooltip */}
        {holidayEvents.length > 0 && (
          <div className="bg-red-100 border-b border-red-300 py-1 px-2 text-xs text-center">
            <div className="flex items-center justify-center space-x-1">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="font-medium text-red-800 flex items-center">
                      {holidayEvents.map(event => `${event.barber} - ${event.title}`).join(', ')}
                      <Info className="inline-block ml-1 w-3.5 h-3.5 text-red-800" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="max-w-xs">
                      {holidayEvents.map((event, index) => (
                        <div key={event.id} className={index > 0 ? "mt-1 pt-1 border-t border-gray-200" : ""}>
                          <span className="font-semibold">{event.barber}:</span> {event.notes || event.title}
                        </div>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        )}
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
