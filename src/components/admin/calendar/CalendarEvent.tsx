
import React, { useState, useEffect } from 'react';
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
  const [backgroundColor, setBackgroundColor] = useState<string>('');
  const [borderColor, setBorderColor] = useState<string>('');
  
  useEffect(() => {
    const initColors = () => {
      const isLunchBreak = event.status === 'lunch-break';
      const isHoliday = event.status === 'holiday';
      
      if (isLunchBreak) {
        // For lunch breaks, use a lighter version of the barber's color
        const color = getBarberColor(event.barberId, true);
        setBackgroundColor(color);
        setBorderColor(color);
      } else if (isHoliday) {
        // For holidays, use a repeating pattern with the barber's color
        const color = getBarberColor(event.barberId, false);
        setBackgroundColor(`repeating-linear-gradient(45deg, ${color}, ${color} 10px, rgba(255, 255, 255, 0.5) 10px, rgba(255, 255, 255, 0.5) 20px)`);
        setBorderColor(color);
      } else {
        // For regular bookings, use the status color
        const color = getEventColor(event.status);
        setBackgroundColor(color);
        setBorderColor(color);
      }
    };
    
    initColors();
  }, [event.barberId, event.status]);

  const isLunchBreak = event.status === 'lunch-break';
  const isHoliday = event.status === 'holiday';
  
  const styles: React.CSSProperties = {
    backgroundColor,
    borderLeft: `4px solid ${borderColor}`,
    color: isLunchBreak || isHoliday ? '#fff' : '#000',
    opacity: isDragging ? 0.5 : 1,
    width: totalSlots > 1 ? `calc(100% / ${totalSlots})` : '100%',
    left: totalSlots > 1 ? `calc(${slotIndex} * (100% / ${totalSlots}))` : '0',
    position: 'absolute',
    height: '100%',
    zIndex: 10, // Add zIndex to ensure events can be clicked
    pointerEvents: 'auto', // Ensure pointer events work
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
        rounded-sm px-2 py-1 text-xs truncate cursor-pointer hover:opacity-90
        ${isLunchBreak ? 'font-bold' : ''}
      `}
      style={styles}
      onClick={handleClick}
    >
      <div className="font-semibold truncate">
        {format(event.start, 'HH:mm')} - {event.title}
      </div>
      {isLunchBreak ? (
        <div className="truncate opacity-90">{event.barber}'s Lunch</div>
      ) : isHoliday ? (
        <div className="truncate opacity-90">{event.barber}'s Holiday</div>
      ) : (
        <div className="truncate opacity-90">{event.barber} - {event.service}</div>
      )}
    </div>
  );
};
