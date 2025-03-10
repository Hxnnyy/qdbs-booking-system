
import React from 'react';
import { useCalendarSettings } from '@/context/CalendarSettingsContext';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export const TimeRangeSettings: React.FC = () => {
  const { startHour, endHour, updateStartHour, updateEndHour } = useCalendarSettings();
  
  // Generate options for the select
  const hoursOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i;
    const label = hour === 0 ? '12 AM' : 
                 hour < 12 ? `${hour} AM` : 
                 hour === 12 ? '12 PM' : 
                 `${hour - 12} PM`;
    return { value: hour, label };
  });

  return (
    <div className="flex flex-col md:flex-row gap-4 items-end">
      <div className="space-y-2">
        <Label htmlFor="start-hour">Start Time</Label>
        <Select 
          value={startHour.toString()} 
          onValueChange={(value) => updateStartHour(parseInt(value))}
        >
          <SelectTrigger id="start-hour" className="w-[140px]">
            <SelectValue placeholder="Start hour" />
          </SelectTrigger>
          <SelectContent>
            {hoursOptions.filter(option => option.value < endHour - 1).map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="end-hour">End Time</Label>
        <Select 
          value={endHour.toString()} 
          onValueChange={(value) => updateEndHour(parseInt(value))}
        >
          <SelectTrigger id="end-hour" className="w-[140px]">
            <SelectValue placeholder="End hour" />
          </SelectTrigger>
          <SelectContent>
            {hoursOptions.filter(option => option.value > startHour + 1).map((option) => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
