
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
    const initColors = async () => {
      const isLunchBreak = event.status === 'lunch-break';
      const isHoliday = event.status === 'holiday';
      
      if (isLunchBreak) {
        const rgb = await getBarberColor(event.barberId, true);
        setBackgroundColor(`rgba(${rgb}, 0.2)`);
        setBorderColor(`rgb(${rgb})`);
      } else if (isHoliday) {
        const rgb = await getBarberColor(event.barberId, true);
        setBackgroundColor(`repeating-linear-gradient(45deg, rgba(${rgb}, 0.2), rgba(${rgb}, 0.2) 10px, rgba(${rgb}, 0.3) 10px, rgba(${rgb}, 0.3) 20px)`);
        setBorderColor(`rgb(${rgb})`);
      } else {
        const color = await getBarberColor(event.barberId);
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
    zIndex: 10 + slotIndex, // Add slotIndex to zIndex to ensure proper stacking
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
        ${isLunchBreak || isHoliday ? 'text-white font-bold' : ''}
      `}
      style={styles}
      onClick={handleClick}
      data-event-id={event.id} // Add data attribute for easier debugging
    >
      <div className="font-semibold truncate">
        {format(event.start, 'HH:mm')} - {event.title}
      </div>
      {isLunchBreak ? (
        <div className="truncate opacity-90">{event.barber}'s Lunch</div>
      ) : isHoliday ? (
        <div className="truncate opacity-90">Holiday - {event.barber}</div>
      ) : (
        <div className="truncate opacity-90">{event.barber} - {event.service}</div>
      )}
    </div>
  );
};
