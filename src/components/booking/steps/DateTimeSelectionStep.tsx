
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { BookingStepProps } from '@/types/booking';
import { Spinner } from '@/components/ui/spinner';
import TimeSlotsGrid from '../TimeSlotsGrid';
import { CalendarEvent } from '@/types/calendar';
import { useAvailability } from '@/hooks/useAvailability';

interface DateTimeSelectionStepProps extends BookingStepProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  onRetry?: () => void;
  selectedBarberId?: string | null;
  serviceDuration?: number;
  existingBookings?: any[];
  allEvents?: CalendarEvent[];
  availableTimeSlots?: string[];
  isLoadingTimeSlots?: boolean;
  isCheckingDates?: boolean;
  isDateDisabled?: (date: Date) => boolean;
  timeSlotError?: string | null;
}

const DateTimeSelectionStep: React.FC<DateTimeSelectionStepProps> = ({ 
  selectedDate, 
  setSelectedDate, 
  selectedTime, 
  setSelectedTime, 
  onNext,
  onBack,
  selectedBarberId,
  allEvents = [],
  serviceDuration = 60,
  onRetry
}) => {
  // Get the selected service
  const selectedServiceDetails = {
    duration: serviceDuration,
    id: 'temp-id'
  };

  // Use our new availability hook
  const {
    availableTimeSlots,
    isLoadingTimeSlots,
    timeSlotError,
    isCheckingDates,
    isDateDisabled,
    refreshAvailability,
    clearCache
  } = useAvailability(
    selectedDate,
    selectedBarberId || null,
    selectedServiceDetails as any,
    allEvents
  );

  const handleRetry = () => {
    // Clear cache and refresh availability
    clearCache();
    refreshAvailability();
    
    // Call onRetry if provided
    if (onRetry) {
      onRetry();
    }
  };

  // Clear selected time when date changes
  useEffect(() => {
    if (selectedDate && selectedTime) {
      console.log('Date changed, clearing selected time');
      setSelectedTime('');
    }
  }, [selectedDate, selectedTime, setSelectedTime]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4 font-playfair">Select Date</h3>
          {isCheckingDates ? (
            <div className="flex justify-center items-center h-72 bg-gray-50 rounded-md border">
              <div className="flex flex-col items-center">
                <Spinner className="h-8 w-8 mb-2" />
                <span className="text-muted-foreground text-sm">Loading calendar availability...</span>
              </div>
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                console.log('New date selected:', date);
                setSelectedDate(date);
              }}
              disabled={isDateDisabled}
              className="rounded-md border"
            />
          )}
        </div>

        {selectedDate && (
          <div>
            <h3 className="text-xl font-bold mb-4 font-playfair">Select Time</h3>
            
            {timeSlotError ? (
              <div className="text-center p-4 border rounded-md bg-muted flex flex-col items-center">
                <p className="text-muted-foreground mb-4">{timeSlotError}</p>
                <Button 
                  variant="secondary" 
                  onClick={handleRetry}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" /> Retry
                </Button>
              </div>
            ) : (
              <TimeSlotsGrid 
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                setSelectedTime={(time) => {
                  console.log('Time selected:', time);
                  setSelectedTime(time);
                }}
                availableTimeSlots={availableTimeSlots}
                isLoading={isLoadingTimeSlots}
                error={null}
              />
            )}
          </div>
        )}
      </div>
      
      <div className="flex justify-between mt-4">
        <Button 
          variant="outline" 
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Services
        </Button>
        
        <Button 
          onClick={onNext}
          className="bg-burgundy hover:bg-burgundy-light flex items-center gap-2"
          disabled={!selectedDate || !selectedTime}
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};

export default DateTimeSelectionStep;
