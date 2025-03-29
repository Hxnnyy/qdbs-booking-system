
import React, { useState, memo } from 'react';
import { format } from 'date-fns';
import { CalendarEvent as CalendarEventType } from '@/types/calendar';
import { getBarberColor, getEventColor } from '@/utils/calendarUtils';

interface CalendarEventProps {
  event: CalendarEventType;
  onClick?: (event: CalendarEventType) => void;
  slotIndex?: number;
  totalSlots?: number;
  onEventClick?: (event: CalendarEventType) => void;
  onDragStart?: (event: CalendarEventType) => void;
  onDragEnd?: (event: CalendarEventType) => void;
}

// Create a non-memoized component first
const CalendarEventComponent: React.FC<CalendarEventProps> = ({ 
  event, 
  onClick, 
  slotIndex = 0,
  totalSlots = 1,
  onEventClick,
  onDragStart,
  onDragEnd
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const isLunchBreak = event.status === 'lunch-break';
  const isHoliday = event.status === 'holiday';
  
  // Use barberColor from the event if available, otherwise fall back to generated color
  const barberColor = event.barberColor || getBarberColor(event.barberId);
  
  // For lunch breaks, use transparent background with only colored border
  // For holidays, use a semi-transparent red background
  let backgroundColor;
  let borderColor;
  
  if (isHoliday) {
    backgroundColor = 'rgba(255, 0, 0, 0.15)';
    borderColor = 'rgba(255, 0, 0, 0.5)';
  } else if (isLunchBreak) {
    backgroundColor = 'transparent';
    borderColor = barberColor;
  } else {
    backgroundColor = barberColor;
    borderColor = barberColor;
  }
  
  // Fix for overlapping lunch breaks - ensure consistent width calculation
  const slotWidth = 100 / totalSlots;
  const leftPosition = slotIndex * slotWidth;
  
  const styles = {
    backgroundColor: backgroundColor,
    borderLeft: `4px solid ${borderColor}`,
    color: isLunchBreak ? '#fff' : (isHoliday ? '#333' : '#000'),
    opacity: isDragging ? 0.5 : (isLunchBreak ? 0.7 : 1),
    width: `${slotWidth}%`, // Use percentage for consistent sizing
    left: `${leftPosition}%`, // Use percentage for consistent positioning
    position: 'absolute' as const,
    height: '100%',
    zIndex: isDragging ? 30 : 10,
    pointerEvents: 'all' as React.CSSProperties['pointerEvents'],
    cursor: !isLunchBreak && !isHoliday ? 'grab' : 'default',
    // Add will-change to leverage hardware acceleration for transforms
    willChange: 'transform',
    transform: 'translateZ(0)', // Force GPU acceleration
  };
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
    if (onEventClick) {
      onEventClick(event);
    } else if (onClick) {
      onClick(event);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Don't allow dragging lunch breaks or holidays
    if (isLunchBreak || isHoliday) {
      e.preventDefault();
      return;
    }

    // Set the drag data
    e.dataTransfer.setData('application/json', JSON.stringify({
      eventId: event.id,
      eventType: event.status,
      barberId: event.barberId,
      serviceId: event.serviceId,
      serviceDuration: event.end.getTime() - event.start.getTime()
    }));
    
    // Set the drag image (optional)
    const dragElement = document.createElement('div');
    dragElement.textContent = `${event.title} - ${event.barber}`;
    dragElement.style.padding = '10px';
    dragElement.style.background = barberColor;
    dragElement.style.color = 'white';
    dragElement.style.borderRadius = '4px';
    dragElement.style.width = '200px';
    dragElement.style.position = 'absolute';
    dragElement.style.top = '-1000px';
    document.body.appendChild(dragElement);
    
    e.dataTransfer.setDragImage(dragElement, 100, 20);
    
    // Cleanup after a short delay
    setTimeout(() => {
      document.body.removeChild(dragElement);
    }, 0);
    
    setIsDragging(true);
    
    if (onDragStart) {
      onDragStart(event);
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    
    if (onDragEnd) {
      onDragEnd(event);
    }
  };
  
  return (
    <div
      className={`
        rounded-sm px-2 py-1 text-xs truncate cursor-pointer hover:opacity-90 hover:z-20
        ${isLunchBreak ? 'font-bold bg-blue-600' : ''} 
        ${isHoliday ? 'font-bold text-red-800 border border-red-500' : ''}
        ${!isLunchBreak && !isHoliday ? 'shadow-sm' : ''}
      `}
      style={styles}
      onClick={handleClick}
      draggable={!isLunchBreak && !isHoliday}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      title={`${event.title} - ${event.barber} (ID: ${event.barberId})`} // Add debugging info in the tooltip
      data-event-id={event.id} // Add data attribute for easier debugging
    >
      <div className="font-semibold truncate">
        {isHoliday ? (
          event.title
        ) : (
          <>{format(event.start, 'HH:mm')} - {event.title}</>
        )}
      </div>
      {isLunchBreak ? (
        <div className="truncate opacity-90">{event.barber}'s Lunch</div>
      ) : isHoliday ? (
        <div className="truncate opacity-90">{event.barber}</div>
      ) : (
        <div className="truncate opacity-90">{event.barber} - {event.service}</div>
      )}
    </div>
  );
};

// Create a custom comparison function for React.memo
const arePropsEqual = (prevProps: CalendarEventProps, nextProps: CalendarEventProps) => {
  // Check if the events are the same based on important properties
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.event.start.getTime() === nextProps.event.start.getTime() &&
    prevProps.event.end.getTime() === nextProps.event.end.getTime() &&
    prevProps.event.title === nextProps.event.title &&
    prevProps.event.barberId === nextProps.event.barberId &&
    prevProps.event.status === nextProps.event.status &&
    prevProps.slotIndex === nextProps.slotIndex &&
    prevProps.totalSlots === nextProps.totalSlots
  );
};

// Export memoized version of the component
export const CalendarEvent = memo(CalendarEventComponent, arePropsEqual);
