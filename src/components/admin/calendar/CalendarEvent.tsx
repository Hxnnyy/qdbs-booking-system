
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarEvent } from '@/types/calendar';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EventComponentProps {
  event: CalendarEvent;
  onEventClick: (event: CalendarEvent) => void;
  isDragging?: boolean;
  slotIndex?: number; // Position in the stack
  totalSlots?: number; // Total number of events at this time
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
      return '#ea384c';
  }
};

export const CalendarEventComponent: React.FC<EventComponentProps> = ({ 
  event, 
  onEventClick,
  isDragging,
  slotIndex = 0,
  totalSlots = 1
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const barberColor = getBarberColor(event.barberId, event.barber);
  const startTime = format(event.start, 'h:mm a');
  const endTime = format(event.end, 'h:mm a');
  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60); // in minutes
  
  // Clean up title by removing "Guest: " prefix if present
  const cleanTitle = event.title.replace('Guest: ', '');

  // Calculate width and position for overlapping events
  const width = totalSlots > 1 ? `calc((100% - ${(totalSlots - 1) * 4}px) / ${totalSlots})` : 'calc(100% - 8px)';
  const leftOffset = slotIndex * (100 / totalSlots) + 4; // 4px left padding
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              "absolute rounded-md cursor-grab select-none overflow-hidden shadow-sm",
              isDragging ? "opacity-70" : ""
            )}
            style={{
              backgroundColor: '#ea384c20',
              borderLeft: `3px solid ${barberColor}`,
              borderRight: `3px solid ${barberColor}`,
              height: '100%',
              left: `${leftOffset}%`,
              width,
              zIndex: isHovered ? 10 : 5,
            }}
            whileHover={{ 
              scale: 1.02,
              backgroundColor: '#ea384c30',
              zIndex: 10
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onEventClick(event)}
            layout
          >
            <div className="flex flex-col h-full overflow-hidden p-1.5">
              <div className="flex items-center gap-1">
                <p className="text-[11px] font-medium truncate">{cleanTitle}</p>
                <span className="text-[11px] text-muted-foreground truncate">• {event.service}</span>
              </div>
              
              {duration >= 30 && (
                <div className="mt-auto pt-0.5 flex items-center justify-between">
                  <p className="text-[11px] text-muted-foreground truncate">{event.barber}</p>
                  <span className="text-[11px] text-muted-foreground truncate">{startTime}</span>
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
