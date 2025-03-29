
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarEvent, ViewMode } from '@/types/calendar';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, addDays, addWeeks, subDays, subWeeks } from 'date-fns';
import { CalendarSettings } from './CalendarSettings';
import { Skeleton } from '@/components/ui/skeleton';

interface CalendarViewComponentProps {
  events: CalendarEvent[];
  isLoading: boolean;
  onEventDrop: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onDateChange?: (date: Date) => void;
  refreshCalendar?: () => void; // Add refresh function prop
}

export const CalendarViewComponent: React.FC<CalendarViewComponentProps> = ({
  events,
  isLoading,
  onEventDrop,
  onEventClick,
  onDateChange,
  refreshCalendar
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  // Debug events
  useEffect(() => {
    console.log(`CalendarViewComponent received ${events?.length || 0} events, isLoading: ${isLoading}`);
    if (events && events.length > 0) {
      console.log('Sample events:', events.slice(0, 3).map(event => ({
        id: event.id,
        title: event.title,
        barber: event.barber,
        status: event.status,
        date: event.start.toISOString()
      })));
    }
  }, [events, isLoading]);

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
    
    // Trigger refresh
    if (refreshCalendar) {
      console.log('Triggering calendar refresh after date change');
      refreshCalendar();
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

  const handleViewModeChange = (value: string) => {
    setViewMode(value as ViewMode);
    console.log(`View mode changed to ${value}`);
    // Refresh when switching view modes
    if (refreshCalendar) {
      console.log('Triggering calendar refresh after view mode change');
      refreshCalendar();
    }
  };

  const handleManualRefresh = () => {
    if (refreshCalendar) {
      console.log('Manual refresh triggered');
      refreshCalendar();
    }
  };

  // Handle event drop with refresh
  const handleEventDropWithRefresh = (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    onEventDrop(event, newStart, newEnd);
    // Refresh after event drop
    if (refreshCalendar) {
      console.log('Triggering calendar refresh after event drop');
      setTimeout(() => refreshCalendar(), 100);
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-12rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Tabs 
          defaultValue="week" 
          className="w-full sm:w-auto" 
          value={viewMode}
          onValueChange={handleViewModeChange}
        >
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
          
          <Button variant="outline" size="icon" onClick={handleManualRefresh} title="Refresh calendar">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <CalendarSettings />
        </div>
      </div>

      <div className="border rounded-md overflow-hidden flex-1 flex flex-col calendar-scrollable-container">
        {isLoading ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center">
              <Skeleton className="h-8 w-8 rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading calendar data...</p>
            </div>
          </div>
        ) : events && events.length === 0 ? (
          <div className="flex h-full items-center justify-center p-8">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No events found for this time period</p>
              <Button variant="outline" onClick={refreshCalendar}>
                Refresh Calendar
              </Button>
            </div>
          </div>
        ) : viewMode === 'day' ? (
          <DayView
            key={`day-view-${currentDate.toISOString()}`}
            date={currentDate}
            onDateChange={handleDateChange}
            events={events || []}
            onEventDrop={handleEventDropWithRefresh}
            onEventClick={onEventClick}
            refreshCalendar={refreshCalendar}
          />
        ) : (
          <WeekView
            key={`week-view-${currentDate.toISOString()}`}
            date={currentDate}
            onDateChange={handleDateChange}
            events={events || []}
            onEventDrop={handleEventDropWithRefresh}
            onEventClick={onEventClick}
            refreshCalendar={refreshCalendar}
          />
        )}
      </div>
    </div>
  );
};
