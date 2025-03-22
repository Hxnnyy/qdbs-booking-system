
import React, { useEffect } from 'react';
import TimeSlot from '../TimeSlot';
import { Spinner } from '@/components/ui/spinner';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';
import { isSameDay } from 'date-fns';

interface TimeSlotsGridProps {
  selectedDate: Date | undefined;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  availableTimeSlots: string[];
  isLoading: boolean;
  error: string | null;
}

const TimeSlotsGrid: React.FC<TimeSlotsGridProps> = ({
  selectedDate,
  selectedTime,
  setSelectedTime,
  availableTimeSlots,
  isLoading,
  error
}) => {
  // Filter time slots to prevent booking in the past for today
  const filteredTimeSlots = selectedDate ? 
    availableTimeSlots.filter(time => !isTimeSlotInPast(selectedDate, time)) : 
    [];

  // Clear the selected time if it's now in the past
  useEffect(() => {
    if (selectedDate && selectedTime && isTimeSlotInPast(selectedDate, selectedTime)) {
      setSelectedTime('');
    }
  }, [selectedDate, selectedTime, setSelectedTime]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Spinner className="h-8 w-8" />
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

  if (filteredTimeSlots.length === 0) {
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

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {filteredTimeSlots.map((time) => (
        <TimeSlot 
          key={time} 
          time={time} 
          selected={selectedTime === time}
          onClick={() => setSelectedTime(time)}
          disabled={false} // Already filtered out unavailable slots
        />
      ))}
    </div>
  );
};

export default TimeSlotsGrid;
