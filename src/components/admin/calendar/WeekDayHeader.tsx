
import React from 'react';
import { format, isToday, addDays } from 'date-fns';
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';

interface WeekDayHeaderProps {
  day: Date;
  index: number;
  displayEvents: CalendarEvent[];
  weekStart: Date;
}

export const WeekDayHeader: React.FC<WeekDayHeaderProps> = ({ 
  day, 
  index, 
  displayEvents,
  weekStart
}) => {
  // Check if there are any holiday events for this day
  const dayDate = addDays(weekStart, index);
  const holidayEvents = displayEvents.filter(event => 
    event.status === 'holiday' && 
    event.allDay === true &&
    event.start.getDate() === dayDate.getDate() &&
    event.start.getMonth() === dayDate.getMonth() &&
    event.start.getFullYear() === dayDate.getFullYear()
  );
  
  return (
    <div 
      className={`flex flex-col border-r last:border-r-0 border-border ${
        isToday(day) ? 'bg-primary/10' : ''
      }`}
    >
      <div className="h-12 flex flex-col items-center justify-center">
        <div className="text-sm">{format(day, 'EEE')}</div>
        <div className="text-xs text-muted-foreground">{format(day, 'd')}</div>
      </div>
      
      {/* Holiday Indicator with Tooltip */}
      {holidayEvents.length > 0 && (
        <div className="bg-red-100 border-b border-red-300 py-1 px-1 text-xs text-center">
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
      )}
    </div>
  );
};
