
import React from 'react';
import { format } from 'date-fns';
import { CalendarEvent as CalendarEventType } from '@/types/calendar';
import { getBarberColor, getEventColor } from '@/utils/calendarUtils';

interface CalendarEventProps {
  event: CalendarEventType;
  onClick?: (event: CalendarEventType) => void;
  isDragging?: boolean;
  slotIndex?: number;
  totalSlots?: number;
  onEventClick?: (event: CalendarEventType) => void;
}

export const CalendarEvent: React.FC<CalendarEventProps> = ({ 
  event, 
  onClick, 
  isDragging = false,
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
  
  const styles = {
    backgroundColor: backgroundColor,
    borderLeft: `4px solid ${borderColor}`,
    color: isLunchBreak || isHoliday ? 'rgb(153, 27, 27)' : '#000', // Darker red for holidays
    opacity: isLunchBreak ? 0.5 : 1,
    width: totalSlots > 1 ? `calc(100% / ${totalSlots})` : '100%',
    left: totalSlots > 1 ? `calc(${slotIndex} * (100% / ${totalSlots}))` : '0',
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
        ${isLunchBreak ? 'font-bold' : ''}
        ${isHoliday ? 'font-bold text-red-800 border border-red-500' : ''}
      `}
      style={styles}
      onClick={handleClick}
      draggable={!isLunchBreak && !isHoliday} // Only make regular appointments draggable
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
