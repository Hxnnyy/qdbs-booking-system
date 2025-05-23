
import React from 'react';
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
  onRetry?: () => void;
}

const TimeSlotsGrid: React.FC<TimeSlotsGridProps> = ({
  selectedDate,
  selectedTime,
  setSelectedTime,
  availableTimeSlots,
  isLoading,
  error,
  onRetry
}) => {
  // Helper function for debug information
  const getDebugInfo = () => {
    if (!selectedDate) return '';
    
    const dayOfWeek = selectedDate.getDay();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${dayNames[dayOfWeek]} (day ${dayOfWeek})`;
  };

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
        {onRetry && (
          <button 
            className="mt-4 px-4 py-2 text-sm bg-burgundy text-white rounded-md hover:bg-burgundy-light flex items-center justify-center mx-auto"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
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
        <p className="text-xs text-muted-foreground mt-4">{getDebugInfo()}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-xs text-muted-foreground text-right">{getDebugInfo()}</div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-1 max-h-[320px] overflow-y-auto p-1">
        {availableTimeSlots.map((time) => (
          <TimeSlot 
            key={time} 
            time={time} 
            selected={selectedTime === time}
            onClick={() => setSelectedTime(time)}
            disabled={false}
          />
        ))}
      </div>
    </div>
  );
};

export default TimeSlotsGrid;
