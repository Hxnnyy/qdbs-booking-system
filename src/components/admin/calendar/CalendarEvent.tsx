
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarEvent } from '@/types/calendar';
import { Clock, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EventComponentProps {
  event: CalendarEvent;
  onEventClick: (event: CalendarEvent) => void;
  isDragging?: boolean;
}

const getBarberColor = (barberId: string, barberName: string): string => {
  switch (barberName) {
    case 'Chris':
      return '#ea384c';
    case 'Conor':
      return '#22c55e';
    case 'Thomas':
      return '#0EA5E9';
    default:
      return '#ea384c'; // Default to red
  }
};

export const CalendarEventComponent: React.FC<EventComponentProps> = ({ 
  event, 
  onEventClick,
  isDragging
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const barberColor = getBarberColor(event.barberId, event.barber);
  const startTime = format(event.start, 'h:mm a');
  const endTime = format(event.end, 'h:mm a');
  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60); // in minutes
  
  // Clean up title by removing "Guest: " prefix if present
  const cleanTitle = event.title.replace('Guest: ', '');
  
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
              backgroundColor: '#ea384c20', // Translucent red background
              borderLeft: `3px solid ${barberColor}`,
              borderRight: `3px solid ${barberColor}`,
              height: '100%',
              left: '4px',
              zIndex: isHovered ? 10 : 5,
            }}
            whileHover={{ 
              scale: 1.02,
              backgroundColor: '#ea384c30', // Slightly more opaque on hover
              zIndex: 10
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onEventClick(event)}
            layout
          >
            <div className="flex flex-col h-full overflow-hidden p-1.5">
              <span className="text-[11px] font-medium truncate mb-0.5">{startTime} - {endTime}</span>
              
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-medium truncate">{cleanTitle}</p>
                <span className="text-[11px] text-muted-foreground truncate">• {event.service}</span>
              </div>
              
              {duration >= 45 && (
                <div className="mt-auto pt-0.5">
                  <p className="text-[11px] text-muted-foreground truncate">{event.barber}</p>
                </div>
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-2 p-1">
            <div className="font-semibold">{cleanTitle}</div>
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
