
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarEvent, ViewMode } from '@/types/calendar';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, addWeeks, subDays, subWeeks } from 'date-fns';
import { CalendarSettings } from './CalendarSettings';

interface CalendarViewComponentProps {
  events: CalendarEvent[]; // This should already be filtered by barber in the parent component
  isLoading: boolean;
  onEventDrop: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDateChange?: (date: Date) => void; // Add this prop to handle date changes
}

export const CalendarViewComponent: React.FC<CalendarViewComponentProps> = ({
  events,
  isLoading,
  onEventDrop,
  onEventClick,
  onDateChange
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Update the parent component when date changes
  useEffect(() => {
    if (onDateChange) {
      onDateChange(currentDate);
    }
  }, [currentDate, onDateChange]);

  const handleDateChange = (date: Date) => {
    console.log('Date changed in CalendarViewComponent:', date);
    setCurrentDate(date);
    
    // Also call the parent's date change handler directly for immediate update
    if (onDateChange) {
      onDateChange(date);
    }
  };

  const goToToday = () => {
    handleDateChange(new Date());
  };

  const goBack = () => {
    if (viewMode === 'day') {
      handleDateChange(subDays(currentDate, 1));
    } else if (viewMode === 'week') {
      handleDateChange(subWeeks(currentDate, 1));
    }
  };

  const goForward = () => {
    if (viewMode === 'day') {
      handleDateChange(addDays(currentDate, 1));
    } else if (viewMode === 'week') {
      handleDateChange(addWeeks(currentDate, 1));
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs defaultValue="week" className="w-full sm:w-auto" onValueChange={(value) => setViewMode(value as ViewMode)}>
          <TabsList>
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[150px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(currentDate, 'MMMM d, yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && handleDateChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon" onClick={goForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Button variant="outline" onClick={goToToday}>
            Today
          </Button>
          
          <CalendarSettings />
        </div>
      </div>

      <div className="border rounded-md overflow-hidden flex-1 flex flex-col calendar-scrollable-container">
        {viewMode === 'day' ? (
          <DayView
            date={currentDate}
            onDateChange={handleDateChange}
            events={events} // Pass the filtered events
            onEventDrop={onEventDrop}
            onEventClick={onEventClick}
          />
        ) : (
          <WeekView
            date={currentDate}
            onDateChange={handleDateChange}
            events={events} // Pass the filtered events
            onEventDrop={onEventDrop}
            onEventClick={onEventClick}
          />
        )}
      </div>
    </div>
  );
};
