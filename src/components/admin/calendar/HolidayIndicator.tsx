
import React from 'react';
import { CalendarEvent } from '@/types/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface HolidayIndicatorProps {
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
              <div className="font-medium text-red-800 flex items-center">
                {holidayEvents.map(event => `${event.barber} - ${event.title}`).join(', ')}
                <Info className="inline-block ml-1 w-3.5 h-3.5 text-red-800" />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="max-w-xs">
                {holidayEvents.map((event, index) => (
                  <div key={event.id} className={index > 0 ? "mt-1 pt-1 border-t border-gray-200" : ""}>
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
