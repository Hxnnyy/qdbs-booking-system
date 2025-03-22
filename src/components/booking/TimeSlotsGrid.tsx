
import React, { useEffect, useState } from 'react';
import TimeSlot from '../TimeSlot';
import { Spinner } from '@/components/ui/spinner';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';
import { isSameDay } from 'date-fns';
import { toast } from 'sonner';

interface TimeSlotsGridProps {
  selectedDate: Date | undefined;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  availableTimeSlots: string[];
  isLoading: boolean;
  error: string | null;
  selectedBarberId?: string | null;
  serviceDuration?: number;
}

const TimeSlotsGrid: React.FC<TimeSlotsGridProps> = ({
  selectedDate,
  selectedTime,
  setSelectedTime,
  availableTimeSlots,
  isLoading,
  error,
  selectedBarberId,
  serviceDuration = 60
}) => {
  // These are already filtered time slots from the hook
  const timeSlots = availableTimeSlots || [];

  // Clear the selected time if it's now in the past or no longer available
  useEffect(() => {
    if (selectedDate && selectedTime) {
      // Clear if time slot is in the past
      if (isTimeSlotInPast(selectedDate, selectedTime)) {
        setSelectedTime('');
        return;
      }
      
      // Clear if time slot is no longer in the available list
      if (timeSlots.length > 0 && !timeSlots.includes(selectedTime)) {
        setSelectedTime('');
      }
    }
  }, [selectedDate, selectedTime, timeSlots, setSelectedTime]);

  // Debug logging - monitor available time slots
  useEffect(() => {
    if (timeSlots.length > 0) {
      console.log('Time slots received in TimeSlotsGrid:', timeSlots);
    }
  }, [timeSlots]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner className="h-8 w-8" />
        <span className="ml-2 text-muted-foreground">Loading available times...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-4 border rounded-md bg-muted">
        <p className="text-muted-foreground">{error}</p>
        <p className="text-sm mt-2">Please select another date or barber.</p>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md bg-muted">
        <p className="text-muted-foreground">
          {selectedDate && isSameDay(selectedDate, new Date()) && isTimeSlotInPast(selectedDate, '23:59') ? 
            "No more available time slots for today." : 
            "No available time slots for this date."}
        </p>
        <p className="text-sm mt-2">Please select another date or barber.</p>
      </div>
    );
  }

  // Record click handler for additional validation
  const handleTimeSlotClick = (time: string) => {
    // Just a final protection - should never be needed as these time slots are already filtered
    setSelectedTime(time);
  };

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {timeSlots.map((time) => (
        <TimeSlot 
          key={time} 
          time={time} 
          selected={selectedTime === time}
          onClick={() => handleTimeSlotClick(time)}
          disabled={false} // Already filtered out unavailable slots
          data-available="true"
        />
      ))}
    </div>
  );
};

export default TimeSlotsGrid;
