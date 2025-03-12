
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { Checkbox } from '@/components/ui/checkbox';

export const CalendarSettings = () => {
  const { 
    autoScrollToCurrentTime, 
    toggleAutoScroll 
  } = useCalendarSettings();

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
