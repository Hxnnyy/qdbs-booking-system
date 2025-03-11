
import React from 'react';
import { format } from 'date-fns';
import { CalendarEvent as CalendarEventType } from '@/types/calendar';
import { getBarberColor, getEventColor } from '@/utils/calendarUtils';

interface CalendarEventProps {
  event: CalendarEventType;
  onClick: (event: CalendarEventType) => void;
}

export const CalendarEvent: React.FC<CalendarEventProps> = ({ event, onClick }) => {
  const isLunchBreak = event.status === 'lunch-break';
  const eventColor = getEventColor(event);
  
  const styles = {
    backgroundColor: isLunchBreak ? 'rgba(138, 43, 226, 0.2)' : eventColor,
    borderLeft: isLunchBreak ? '4px solid blueviolet' : `4px solid ${eventColor}`,
    color: isLunchBreak ? 'rgb(94, 53, 177)' : '#fff',
  };
  
  return (
    <div
      className={`
        rounded-sm px-2 py-1 text-xs truncate cursor-pointer hover:opacity-90
        ${isLunchBreak ? 'font-bold' : ''}
      `}
      style={styles}
      onClick={() => onClick(event)}
    >
      <div className="font-semibold truncate">
        {format(event.start, 'HH:mm')} - {event.title}
      </div>
      {!isLunchBreak && (
        <div className="truncate opacity-90">{event.barber} - {event.service}</div>
      )}
    </div>
  );
};
