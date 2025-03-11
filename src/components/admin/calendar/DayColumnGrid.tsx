
import React from 'react';

interface DayColumnGridProps {
  totalHours: number;
}

export const DayColumnGrid: React.FC<DayColumnGridProps> = ({ totalHours }) => {
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
    </>
  );
};
