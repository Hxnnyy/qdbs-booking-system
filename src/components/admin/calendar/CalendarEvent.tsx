
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarEvent } from '@/types/calendar';
import { getBarberColor } from '@/utils/calendarUtils';
import { CalendarIcon, Clock, Star, UserCircle2, Users, Scissors } from 'lucide-react';
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
  const barberColor = getBarberColor(event.barberId, event.barber);
  const startTime = format(event.start, 'h:mm a');
  const endTime = format(event.end, 'h:mm a');
  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60); // in minutes
  
  // Height based on duration (1 minute = 2px since we doubled the row height)
  const height = Math.max(duration * 2, 60); // Minimum height of 60px (was 30px)
  
  // Calculate top position (hours * 120 + minutes * 2) - adjusted for the new row height
  const hours = event.start.getHours();
  const minutes = event.start.getMinutes();
  const topPosition = (hours - 8) * 120 + minutes * 2; // Offset by 8 hours, multiply by 120px per hour
  
  // Determine background color based on status
  const getStatusBackground = () => {
    switch(event.status) {
      case 'confirmed': return 'bg-blue-50 border-l-4 border-blue-500';
      case 'completed': return 'bg-green-50 border-l-4 border-green-500';
      case 'cancelled': return 'bg-red-50 border-l-4 border-red-500';
      case 'no-show': return 'bg-amber-50 border-l-4 border-amber-500';
      default: return 'bg-gray-50 border-l-4 border-gray-500';
    }
  };
  
  const getClientName = () => {
    if (event.isGuest) {
      return event.title.replace('Guest: ', '');
    }
    return event.title.replace('Client Booking', event.notes || 'Client');
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={`absolute rounded-md cursor-grab select-none overflow-hidden shadow-sm ${getStatusBackground()}`}
            style={{
              height: `${height}px`,
              top: `${topPosition}px`,
              zIndex: isHovered ? 10 : 5,
              width: 'calc(100% - 8px)',
              marginLeft: '4px',
              marginRight: '4px',
              borderLeftColor: barberColor,
            }}
            whileHover={{ 
              scale: 1.02,
              zIndex: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={() => onEventClick(event)}
            layout
          >
            <div className="flex flex-col h-full overflow-hidden p-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-900">
                  {startTime} - {endTime}
                </span>
                {event.isGuest ? (
                  <Users size={16} className="shrink-0 text-gray-600" />
                ) : (
                  <UserCircle2 size={16} className="shrink-0 text-gray-600" />
                )}
              </div>
              
              <p className="text-md font-medium text-gray-900 truncate mt-1">
                {getClientName()}
              </p>
              
              <div className="flex items-center gap-1 mt-1">
                <Scissors size={14} className="text-gray-500" />
                <p className="text-sm text-gray-700 truncate">
                  {event.service}
                </p>
              </div>
              
              {height > 100 && (
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: barberColor }} 
                    />
                    <span className="text-xs text-gray-500">{event.barber}</span>
                  </div>
                  {event.notes && <Star size={14} className="text-amber-400" />}
                </div>
              )}
            </div>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="right" className="p-0 overflow-hidden">
          <div className="p-3 max-w-xs">
            <div className="font-semibold">{getClientName()}</div>
            <div className="flex items-center gap-2 text-xs mt-2">
              <CalendarIcon size={14} />
              <span>{format(event.start, 'dd MMM yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <Clock size={14} />
              <span>{startTime} - {endTime}</span>
            </div>
            <div className="mt-2">
              <div className="text-xs font-medium">Service:</div>
              <div className="text-sm">{event.service}</div>
            </div>
            <div className="mt-2">
              <div className="text-xs font-medium">Barber:</div>
              <div className="text-sm">{event.barber}</div>
            </div>
            <div className="mt-2">
              <div className="text-xs font-medium">Status:</div>
              <div className="text-sm capitalize">{event.status}</div>
            </div>
            {event.notes && (
              <div className="mt-2">
                <div className="text-xs font-medium">Notes:</div>
                <div className="text-sm">{event.notes}</div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
