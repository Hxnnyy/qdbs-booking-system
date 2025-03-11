
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
  
  // Use barberColor from the event if available, otherwise fall back to generated color
  const barberColor = event.barberColor || getBarberColor(event.barberId);
  
  // For lunch breaks, use transparent background with only colored border
  const backgroundColor = isLunchBreak 
    ? 'transparent' // Completely transparent background for lunch breaks
    : barberColor;
  
  // For lunch breaks, use the solid barber color for the border
  const borderColor = isLunchBreak 
    ? barberColor 
    : barberColor;
  
  const styles = {
    backgroundColor: backgroundColor,
    borderLeft: `4px solid ${borderColor}`,
    color: isLunchBreak ? '#fff' : '#000', // White text for lunch breaks, black for regular appointments
    opacity: isDragging ? 0.5 : 1,
    width: totalSlots > 1 ? `calc(100% / ${totalSlots})` : '100%',
    left: totalSlots > 1 ? `calc(${slotIndex} * (100% / ${totalSlots}))` : '0',
    position: 'absolute' as const,
    height: '100%',
    // Add z-index that increases on hover to ensure any event can be clicked
    zIndex: 10,
    pointerEvents: 'all', // Ensure events are always clickable
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
      `}
      style={styles}
      onClick={handleClick}
      draggable={!isLunchBreak} // Only make non-lunch break events draggable
    >
      <div className="font-semibold truncate">
        {format(event.start, 'HH:mm')} - {event.title}
      </div>
      {isLunchBreak ? (
        <div className="truncate opacity-90">{event.barber}'s Lunch</div>
      ) : (
        <div className="truncate opacity-90">{event.barber} - {event.service}</div>
      )}
    </div>
  );
};
