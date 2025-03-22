
import React, { useState } from 'react';
import TimeSlot from '../TimeSlot';
import { Spinner } from '@/components/ui/spinner';
import { getNoTimeSlotsMessage } from '@/utils/bookingTimeUtils';

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
  error
}) => {
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

  if (availableTimeSlots.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md bg-muted">
        <p className="text-muted-foreground">
          {getNoTimeSlotsMessage(selectedDate)}
        </p>
        <p className="text-sm mt-2">Please select another date or barber.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {availableTimeSlots.map((time) => (
        <TimeSlot 
          key={time} 
          time={time} 
          selected={selectedTime === time}
          onClick={() => setSelectedTime(time)}
          disabled={false} // Already filtered by edge function
          data-edge-filtered="true" // For debugging
        />
      ))}
    </div>
  );
};

export default TimeSlotsGrid;
