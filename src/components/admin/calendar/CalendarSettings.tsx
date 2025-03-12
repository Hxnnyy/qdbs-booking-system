
import React from 'react';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const CalendarSettings = () => {
  const { 
    autoScrollToCurrentTime, 
    toggleAutoScroll,
    startHour,
    endHour,
    updateStartHour,
    updateEndHour
  } = useCalendarSettings();

  // Generate hours for the select dropdowns
  const hours = Array.from({ length: 24 }, (_, i) => ({
    value: i,
    label: `${i === 0 ? '12' : i > 12 ? i - 12 : i}${i < 12 ? 'AM' : 'PM'}`
  }));

  const handleStartHourChange = (value: string) => {
    updateStartHour(parseInt(value));
  };

  const handleEndHourChange = (value: string) => {
    updateEndHour(parseInt(value));
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="h-9 w-9">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Calendar settings</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-medium leading-none mb-3">Calendar Settings</h4>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="start-hour">Start Hour</Label>
              <Select value={startHour.toString()} onValueChange={handleStartHourChange}>
                <SelectTrigger id="start-hour">
                  <SelectValue placeholder="Select start hour" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem 
                      key={hour.value} 
                      value={hour.value.toString()}
                      disabled={hour.value >= endHour - 1}
                    >
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="end-hour">End Hour</Label>
              <Select value={endHour.toString()} onValueChange={handleEndHourChange}>
                <SelectTrigger id="end-hour">
                  <SelectValue placeholder="Select end hour" />
                </SelectTrigger>
                <SelectContent>
                  {hours.map((hour) => (
                    <SelectItem 
                      key={hour.value} 
                      value={hour.value.toString()}
                      disabled={hour.value <= startHour + 1}
                    >
                      {hour.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="auto-scroll" 
              checked={autoScrollToCurrentTime}
              onCheckedChange={() => toggleAutoScroll()}
            />
            <Label htmlFor="auto-scroll">Auto-scroll to current time when viewing today</Label>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
