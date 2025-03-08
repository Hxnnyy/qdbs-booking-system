
import React, { useState, useEffect } from 'react';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { CalendarEvent, ViewMode } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Avatar } from '@/components/ui/avatar';
import { format, addDays, subDays, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { useBarbers } from '@/hooks/useBarbers';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const { barbers, isLoading: loadingBarbers } = useBarbers();
  
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
      {/* Calendar header with enhanced styling */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigatePrevious}
              className="bg-white/80 hover:bg-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={cn(
                    "pl-3 text-left font-normal bg-white/80 hover:bg-white border-primary/20",
                    isToday(selectedDate) && "bg-primary/10 border-primary/30"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  <span className="font-medium">{getDateDisplay()}</span>
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
              className="bg-white/80 hover:bg-white"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateToday}
              className={cn(
                "bg-white/80 hover:bg-white", 
                isToday(selectedDate) && "bg-primary/10 border-primary/30 font-medium"
              )}
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
              <TabsList className="grid w-full grid-cols-2 bg-white/80">
                <TabsTrigger value="day" className="data-[state=active]:bg-primary/10">Day</TabsTrigger>
                <TabsTrigger value="week" className="data-[state=active]:bg-primary/10">Week</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* Barber Selection Tabs */}
      <ScrollArea className="max-w-full pb-4">
        <div className="flex space-x-2 min-w-max pb-2">
          <Button 
            variant={selectedBarberId === null ? "default" : "outline"}
            size="sm"
            className="rounded-full px-4"
            onClick={() => setSelectedBarberId(null)}
          >
            All Barbers
          </Button>
          
          {loadingBarbers ? (
            <div className="flex items-center justify-center px-4">
              <Spinner className="h-4 w-4" />
            </div>
          ) : (
            barbers.map(barber => (
              <Button
                key={barber.id}
                variant={selectedBarberId === barber.id ? "default" : "outline"}
                size="sm"
                className="rounded-full px-4 flex items-center space-x-2"
                onClick={() => setSelectedBarberId(barber.id)}
              >
                <Avatar className="h-6 w-6">
                  {barber.image_url ? (
                    <img 
                      src={barber.image_url} 
                      alt={barber.name} 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="bg-muted h-full w-full flex items-center justify-center text-xs font-medium">
                      {barber.name.charAt(0)}
                    </div>
                  )}
                </Avatar>
                <span>{barber.name}</span>
              </Button>
            ))
          )}
        </div>
      </ScrollArea>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="w-8 h-8" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          {viewMode === 'day' && (
            <DayView 
              date={selectedDate}
              onDateChange={setSelectedDate}
              events={events}
              onEventDrop={onEventDrop}
              onEventClick={onEventClick}
              selectedBarberId={selectedBarberId}
            />
          )}
          {viewMode === 'week' && (
            <WeekView 
              date={selectedDate}
              onDateChange={setSelectedDate}
              events={events}
              onEventDrop={onEventDrop}
              onEventClick={onEventClick}
              selectedBarberId={selectedBarberId}
            />
          )}
        </div>
      )}
    </div>
  );
};
