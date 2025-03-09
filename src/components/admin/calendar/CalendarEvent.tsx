
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarEvent } from '@/types/calendar';
import { getBarberColor } from '@/utils/calendarUtils';
import { Clock, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EventComponentProps {
  event: CalendarEvent;
  onEventClick: (event: CalendarEvent) => void;
  isDragging?: boolean;
}

export const CalendarEventComponent: React.FC<EventComponentProps> = ({ 
  event, 
  onEventClick,
  isDragging
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const barberColor = getBarberColor(event.barberId);
  const startTime = format(event.start, 'h:mm a');
  const endTime = format(event.end, 'h:mm a');
  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60); // in minutes
  
  // Height based on duration (1 minute = 1px)
  const height = Math.max(duration, 30); // Minimum height of 30px
  
  // Calculate top position (hours * 60 + minutes)
  const hours = event.start.getHours();
  const minutes = event.start.getMinutes();
  const topPosition = (hours - 8) * 60 + minutes; // Adjust for 8AM start
  
  const isShortEvent = height < 60;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              "absolute w-[calc(100%-8px)] rounded-md cursor-grab select-none overflow-hidden shadow-sm",
              isDragging ? "opacity-70" : ""
            )}
            style={{
              backgroundColor: `${barberColor}20`, // 20% opacity
              borderLeft: `3px solid ${barberColor}`,
              height: `${height}px`,
              top: `${topPosition}px`,
              left: '4px',
              zIndex: isHovered ? 10 : 5,
            }}
            whileHover={{ 
              scale: 1.02,
              backgroundColor: `${barberColor}30`, // 30% opacity
              zIndex: 10
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onEventClick(event)}
            layout
          >
            <div className="flex flex-col h-full overflow-hidden p-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium truncate">{startTime} - {endTime}</span>
              </div>
              
              {!isShortEvent && (
                <>
                  <p className="text-xs font-semibold truncate">{event.title}</p>
                  
                  {height > 60 && (
                    <>
                      <div className="flex items-center gap-1 mt-1">
                        <Scissors className="h-3 w-3 text-muted-foreground" />
                        <p className="text-xs truncate text-muted-foreground">{event.service}</p>
                      </div>
                      
                      <div className="mt-auto pt-1">
                        <p className="text-xs font-medium truncate">{event.barber}</p>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-2 p-1">
            <div className="font-semibold">{event.title}</div>
            <div className="flex items-center gap-2 text-xs">
              <Clock size={12} />
              <span>{startTime} - {endTime}</span>
            </div>
            <div className="text-xs">Service: {event.service}</div>
            <div className="text-xs">Barber: {event.barber}</div>
            <div className="text-xs">Status: {event.status}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
