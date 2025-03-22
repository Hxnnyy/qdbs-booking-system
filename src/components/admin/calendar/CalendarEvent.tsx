
import React from 'react';
import { format } from 'date-fns';
import { CalendarEvent as CalendarEventType } from '@/types/calendar';
import { getBarberColor, getEventColor } from '@/utils/calendarUtils';

interface CalendarEventProps {
  event: CalendarEventType;
  onClick?: (event: CalendarEventType) => void;
  slotIndex?: number;
  totalSlots?: number;
  onEventClick?: (event: CalendarEventType) => void;
}

export const CalendarEvent: React.FC<CalendarEventProps> = ({ 
  event, 
  onClick, 
  slotIndex = 0,
  totalSlots = 1,
  onEventClick
}) => {
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
    opacity: isLunchBreak ? 0.7 : 1,
    width: `${slotWidth}%`, // Use percentage for consistent sizing
    left: `${leftPosition}%`, // Use percentage for consistent positioning
    position: 'absolute' as const,
    height: '100%',
    zIndex: 10,
    pointerEvents: 'all' as React.CSSProperties['pointerEvents'],
  };
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
    if (onEventClick) {
      onEventClick(event);
    } else if (onClick) {
      onClick(event);
    }
  };
  
  return (
    <div
      className={`
        rounded-sm px-2 py-1 text-xs truncate cursor-pointer hover:opacity-90 hover:z-20
        ${isLunchBreak ? 'font-bold bg-blue-600' : ''} 
        ${isHoliday ? 'font-bold text-red-800 border border-red-500' : ''}
      `}
      style={styles}
      onClick={handleClick}
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
