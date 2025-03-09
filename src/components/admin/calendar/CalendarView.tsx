
import React, { useState } from 'react';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { CalendarEvent, ViewMode } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

interface CalendarViewComponentProps {
  events: CalendarEvent[];
  isLoading: boolean;
  onEventDrop: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export const CalendarViewComponent: React.FC<CalendarViewComponentProps> = ({
  events,
  isLoading,
  onEventDrop,
  onEventClick
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  
  const navigateToday = () => {
    setSelectedDate(new Date());
  };
  
  const navigatePrevious = () => {
    if (viewMode === 'day') {
      setSelectedDate(prev => subDays(prev, 1));
    } else if (viewMode === 'week') {
      setSelectedDate(prev => subDays(prev, 7));
    }
  };
  
  const navigateNext = () => {
    if (viewMode === 'day') {
      setSelectedDate(prev => addDays(prev, 1));
    } else if (viewMode === 'week') {
      setSelectedDate(prev => addDays(prev, 7));
    }
  };

  // Determine date display based on view mode
  const getDateDisplay = () => {
    if (viewMode === 'day') {
      return format(selectedDate, 'MMMM d, yyyy');
    } else if (viewMode === 'week') {
      const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
      const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
      if (format(start, 'MMM') === format(end, 'MMM')) {
        return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`;
      } else {
        return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
      }
    }
    return format(selectedDate, 'MMMM d, yyyy');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigatePrevious}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className={cn(
                  "pl-3 text-left font-normal",
                  isToday(selectedDate) && "bg-primary/10"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {getDateDisplay()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={navigateToday}
            className={cn(isToday(selectedDate) && "bg-primary/10")}
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs 
            defaultValue="day" 
            value={viewMode} 
            onValueChange={(value) => setViewMode(value as ViewMode)}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      ) : (
        <div className="w-full">
          {viewMode === 'day' && (
            <DayView 
              date={selectedDate}
              onDateChange={setSelectedDate}
              events={events}
              onEventDrop={onEventDrop}
              onEventClick={onEventClick}
            />
          )}
          {viewMode === 'week' && (
            <WeekView 
              date={selectedDate}
              onDateChange={setSelectedDate}
              events={events}
              onEventDrop={onEventDrop}
              onEventClick={onEventClick}
            />
          )}
        </div>
      )}
    </div>
  );
};
