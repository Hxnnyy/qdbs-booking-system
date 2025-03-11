
import React from 'react';
import { format, isToday } from 'date-fns';

interface DayHeaderProps {
  date: Date;
}

export const DayHeader: React.FC<DayHeaderProps> = ({ date }) => {
  return (
    <div className={`h-12 border-b border-border font-medium flex flex-col items-center justify-center ${
      isToday(date) ? 'bg-primary/10' : ''
    }`}>
      <div className="text-sm">{format(date, 'EEEE')}</div>
      <div className="text-xs text-muted-foreground">{format(date, 'MMMM d')}</div>
    </div>
  );
};
