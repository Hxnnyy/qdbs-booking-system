
import React from 'react';
import { CalendarEvent } from '@/types/calendar';
import { format } from 'date-fns';
import { getBarberColor } from '@/utils/calendarUtils';
import { Scissors, User, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarEventCardProps {
  event: CalendarEvent;
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarEventCard: React.FC<CalendarEventCardProps> = ({ 
  event, 
  onEventClick 
}) => {
  const barberColor = getBarberColor(event.barberId, event.barber);
  const startTime = format(event.start, 'h:mm a');
  const endTime = format(event.end, 'h:mm a');
  
  // Determine background color based on status
  const getStatusClasses = () => {
    switch(event.status) {
      case 'confirmed':
        return 'bg-white dark:bg-gray-800 border-l-4 border-blue-500 shadow-sm';
      case 'completed':
        return 'bg-white dark:bg-gray-800 border-l-4 border-green-500 shadow-sm';
      case 'cancelled':
        return 'bg-white dark:bg-gray-800 border-l-4 border-red-500 shadow-sm opacity-70';
      case 'no-show':
        return 'bg-white dark:bg-gray-800 border-l-4 border-amber-500 shadow-sm';
      default:
        return 'bg-white dark:bg-gray-800 border-l-4 border-gray-500 shadow-sm';
    }
  };
  
  const getClientName = () => {
    if (event.isGuest) {
      return event.title.replace('Guest: ', '');
    }
    return event.title.replace('Client Booking', event.notes || 'Client');
  };

  // Calculate if it's a short appointment (less than 45 mins)
  const duration = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
  const isShortAppointment = duration < 45;
  
  return (
    <div
      className={cn(
        'h-full rounded-md overflow-hidden cursor-pointer transition-all',
        getStatusClasses()
      )}
      onClick={() => onEventClick(event)}
      style={{ borderLeftColor: barberColor }}
    >
      <div className="h-full p-2 flex flex-col">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{startTime} - {endTime}</span>
          {event.isGuest ? (
            <Users size={12} className="shrink-0" />
          ) : (
            <User size={12} className="shrink-0" />
          )}
        </div>
        
        <div className="font-medium text-sm mt-0.5 text-gray-900 dark:text-gray-100 truncate">
          {getClientName()}
        </div>
        
        {!isShortAppointment && (
          <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-600 dark:text-gray-400">
            <Scissors size={10} />
            <span className="truncate">{event.service}</span>
          </div>
        )}
        
        {!isShortAppointment && (
          <div className="flex items-center mt-auto">
            <div 
              className="h-2 w-2 rounded-full mr-1.5"
              style={{ backgroundColor: barberColor }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {event.barber}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
