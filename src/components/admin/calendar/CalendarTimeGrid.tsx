
import React from 'react';
import { isToday } from 'date-fns';

interface CalendarTimeGridProps {
  totalHours: number;
  startHour: number;
  date: Date;
  children?: React.ReactNode;
}

export const CalendarTimeGrid: React.FC<CalendarTimeGridProps> = ({ 
  totalHours, 
  startHour, 
  date,
  children 
}) => {
  const isCurrentDay = isToday(date);

  return (
    <>
      {Array.from({ length: totalHours + 1 }).map((_, index) => (
        <div 
          key={`grid-${index}`}
          className="absolute w-full h-[60px] border-b border-border"
          style={{ top: `${index * 60}px` }}
        >
          {index < totalHours && (
            <>
              <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '15px' }}></div>
              <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '30px' }}></div>
              <div className="absolute left-0 right-0 h-[1px] border-b border-border/30" style={{ top: '45px' }}></div>
            </>
          )}
        </div>
      ))}
      
      {isCurrentDay && (() => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        
        if (hours < startHour || hours >= startHour + totalHours) return null;
        
        const position = (hours - startHour) * 60 + minutes;
        
        return (
          <div 
            className="absolute left-0 right-0 h-[2px] bg-red-500 z-20 pointer-events-none"
            style={{ top: `${position}px` }}
          >
            <div className="absolute -left-1 -top-[4px] w-2 h-2 rounded-full bg-red-500" />
          </div>
        );
      })()}

      {children}
    </>
  );
};
