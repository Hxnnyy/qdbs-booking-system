
import React from 'react';
import { format, isToday } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';

interface DayHeaderProps {
  date: Date;
  holidayEvents: CalendarEvent[];
}

export const DayHeader: React.FC<DayHeaderProps> = ({ date, holidayEvents }) => {
  return (
    <div className={`h-12 flex flex-col items-center justify-center ${isToday(date) ? 'bg-primary/10' : ''}`}>
      <div className="text-sm">{format(date, 'EEEE')}</div>
      <div className="text-xs text-muted-foreground">{format(date, 'MMMM d')}</div>
    </div>
  );
};
