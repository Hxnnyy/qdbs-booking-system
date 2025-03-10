
import React from 'react';
import { format, addHours, startOfDay, isToday } from 'date-fns';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { motion } from 'framer-motion';

interface TimeGridProps {
  date: Date;
  children: React.ReactNode;
}

export const TimeGrid: React.FC<TimeGridProps> = ({ date, children }) => {
  const { startHour, endHour } = useCalendarSettings();
  const totalHours = endHour - startHour;
  
  // Generate hour time slots
  const hourTimeSlots = Array.from({ length: totalHours + 1 }).map((_, index) => {
    const slotTime = addHours(startOfDay(date), startHour + index);
    return {
      time: format(slotTime, 'HH:mm'),
      label: format(slotTime, 'ha')
    };
  });

  return (
    <div className="relative h-full w-full">
      {/* Hour lines */}
      {hourTimeSlots.map((slot, index) => (
        <div 
          key={`hour-${slot.time}`} 
          className="absolute w-full h-[60px] border-b border-border flex items-start"
          style={{ top: `${index * 60}px`, left: 0, right: 0 }}
        >
          {/* Time label */}
          <div className="w-16 pr-2 text-right text-xs text-muted-foreground pt-1">
            {slot.label}
          </div>
          
          {/* Hour grid line */}
          <div className="flex-1">
            {/* Quarter-hour markers */}
            {index < hourTimeSlots.length - 1 && (
              <>
                <div className="absolute left-16 right-0 h-[1px] border-b border-border/30" style={{ top: '15px' }}></div>
                <div className="absolute left-16 right-0 h-[1px] border-b border-border/30" style={{ top: '30px' }}></div>
                <div className="absolute left-16 right-0 h-[1px] border-b border-border/30" style={{ top: '45px' }}></div>
              </>
            )}
          </div>
        </div>
      ))}
      
      {/* Content overlay */}
      <div className="absolute top-0 left-16 right-0 bottom-0">
        {children}
      </div>
      
      {/* Current time indicator */}
      {isToday(date) && <CurrentTimeIndicator />}
    </div>
  );
};

const CurrentTimeIndicator: React.FC = () => {
  const { startHour, endHour } = useCalendarSettings();
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  
  // Only show if time is within our display range
  if (hours < startHour || hours >= endHour) return null;
  
  // Calculate position (pixels from top)
  const position = (hours - startHour) * 60 + minutes;
  
  return (
    <motion.div 
      className="absolute left-16 right-0 h-[2px] bg-red-500 z-20 pointer-events-none"
      style={{ top: `${position}px` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="absolute -left-1 -top-[4px] w-2 h-2 rounded-full bg-red-500" />
    </motion.div>
  );
};
