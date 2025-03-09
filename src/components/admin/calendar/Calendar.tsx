
import React, { useState } from 'react';
import { WeekView } from './WeekView';
import { DayView } from './DayView';
import { CalendarEvent, ViewMode } from '@/types/calendar';
import { Button } from '@/components/ui/button';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  User
} from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Calendar as DatePicker } from '@/components/ui/calendar';
import { Avatar } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { useBarbers } from '@/hooks/useBarbers';
import { cn } from '@/lib/utils';
import { 
  format, 
  addDays, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  isToday 
} from 'date-fns';

interface CalendarProps {
  events: CalendarEvent[];
  isLoading: boolean;
  onEventDrop: (event: CalendarEvent, newStart: Date, newEnd: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
}

export const Calendar: React.FC<CalendarProps> = ({
  events,
  isLoading,
  onEventDrop,
  onEventClick
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  
  const { barbers, isLoading: loadingBarbers } = useBarbers();

  const navigateToday = () => setSelectedDate(new Date());

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
    return '';
  };

  return (
    <div className="flex flex-col h-full bg-background dark:bg-gray-800">
      {/* Calendar header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border">
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
                <DatePicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={date => date && setSelectedDate(date)}
                  initialFocus
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
            <div className="flex rounded-md overflow-hidden">
              <Button
                variant={viewMode === 'day' ? 'default' : 'outline'}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode('day')}
              >
                Day
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'outline'}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode('week')}
              >
                Week
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Barber filter row */}
      <div className="flex border-b border-border overflow-x-auto py-2 px-4 gap-2">
        <Button 
          variant={selectedBarberId === null ? "default" : "outline"} 
          size="sm" 
          className="rounded-full whitespace-nowrap"
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
              className="rounded-full whitespace-nowrap flex items-center gap-2"
              onClick={() => setSelectedBarberId(barber.id)}
            >
              <Avatar className="h-6 w-6">
                {barber.image_url ? (
                  <img src={barber.image_url} alt={barber.name} className="h-full w-full object-cover" />
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
      
      {/* Calendar content */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          viewMode === 'day' ? (
            <DayView
              date={selectedDate}
              onDateChange={setSelectedDate}
              events={events}
              onEventDrop={onEventDrop}
              onEventClick={onEventClick}
              selectedBarberId={selectedBarberId}
            />
          ) : (
            <WeekView
              date={selectedDate}
              onDateChange={setSelectedDate}
              events={events}
              onEventDrop={onEventDrop}
              onEventClick={onEventClick}
              selectedBarberId={selectedBarberId}
            />
          )
        )}
      </div>
    </div>
  );
};
