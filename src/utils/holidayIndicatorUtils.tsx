
import React from 'react';
import { CalendarEvent } from '@/types/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

export interface HolidayIndicatorProps {
  holidayEvents: CalendarEvent[];
}

export const HolidayIndicator: React.FC<HolidayIndicatorProps> = ({ holidayEvents }) => {
  if (holidayEvents.length === 0) return null;
  
  return (
    <div className="bg-red-100 border-b border-red-300 py-1 px-2 text-xs text-center">
      <div className="flex items-center justify-center space-x-1">
        <span className="inline-block w-2 h-2 bg-red-500 rounded-full"></span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="font-medium text-red-800 flex items-center truncate">
                <span className="truncate">{holidayEvents.map(event => event.barber).join(', ')}</span>
                <Info className="inline-block shrink-0 ml-0.5 w-3.5 h-3.5 text-red-800" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                {holidayEvents.map((event, idx) => (
                  <div key={event.id} className={idx > 0 ? "mt-1 pt-1 border-t border-gray-200" : ""}>
                    <span className="font-semibold">{event.barber}:</span> {event.notes || event.title}
                  </div>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

// Helper function to extract holiday events for a specific date
export const getHolidayEventsForDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  return events.filter(event => 
    event.status === 'holiday' && 
    event.allDay === true &&
    event.start.getDate() === date.getDate() &&
    event.start.getMonth() === date.getMonth() &&
    event.start.getFullYear() === date.getFullYear()
  );
};
