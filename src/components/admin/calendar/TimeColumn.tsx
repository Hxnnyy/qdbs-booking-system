
import React from 'react';

interface TimeColumnProps {
  startHour: number;
  totalHours: number;
}

export const TimeColumn: React.FC<TimeColumnProps> = ({ startHour, totalHours }) => {
  return (
    <div className="time-column border-r border-border">
      {Array.from({ length: totalHours + 1 }).map((_, index) => {
        const hour = startHour + index;
        return (
          <div 
            key={`time-${hour}`}
            className="h-[60px] flex items-center justify-end pr-2 text-xs text-muted-foreground"
          >
            {hour % 12 === 0 ? '12' : hour % 12}{hour < 12 ? 'am' : 'pm'}
          </div>
        );
      })}
    </div>
  );
};
