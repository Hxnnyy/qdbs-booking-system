
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarEvent } from '@/types/calendar';
import { getBarberColor } from '@/utils/calendarUtils';
import { CalendarIcon, UserCircle2, Users } from 'lucide-react';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface EventComponentProps {
  event: CalendarEvent;
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarEventComponent: React.FC<EventComponentProps> = ({ 
  event, 
  onEventClick 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const barberColor = getBarberColor(event.barberId);
  const startTime = format(event.start, 'HH:mm');
  const endTime = format(event.end, 'HH:mm');
  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60); // in minutes
  
  // Height based on duration (1 minute = 1px)
  const height = Math.max(duration, 30); // Minimum height of 30px
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className="absolute w-full rounded-md cursor-grab select-none overflow-hidden"
            style={{
              backgroundColor: `${barberColor}20`, // 20% opacity
              borderLeft: `4px solid ${barberColor}`,
              height: `${height}px`,
              top: `${event.start.getHours() * 60 + event.start.getMinutes()}px`,
              zIndex: isHovered ? 10 : 5,
            }}
            whileHover={{ 
              scale: 1.02,
              backgroundColor: `${barberColor}40`, // 40% opacity
              zIndex: 10
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onEventClick(event)}
            layout
          >
            <div className="flex flex-col h-full overflow-hidden p-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium truncate">{startTime}-{endTime}</span>
                {event.isGuest ? (
                  <Users size={14} className="shrink-0 text-gray-600" />
                ) : (
                  <UserCircle2 size={14} className="shrink-0 text-gray-600" />
                )}
              </div>
              
              {height > 50 && (
                <>
                  <p className="text-xs font-medium truncate">{event.title}</p>
                  {height > 60 && (
                    <>
                      <p className="text-xs truncate">{event.service}</p>
                      <p className="text-xs truncate">{event.barber}</p>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="space-y-2">
            <div className="font-semibold">{event.title}</div>
            <div className="flex items-center gap-2 text-xs">
              <CalendarIcon size={14} />
              <span>{format(event.start, 'dd MMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span>Time: {startTime} - {endTime}</span>
            </div>
            <div className="text-xs">Service: {event.service}</div>
            <div className="text-xs">Barber: {event.barber}</div>
            <div className="text-xs">Status: {event.status}</div>
            <div className="text-xs">{event.isGuest ? 'Guest Booking' : 'Client Booking'}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
