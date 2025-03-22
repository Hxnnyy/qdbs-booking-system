
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, ArrowRight, RefreshCw } from 'lucide-react';
import { BookingStepProps } from '@/types/booking';
import { Spinner } from '@/components/ui/spinner';
import TimeSlotsGrid from '../TimeSlotsGrid';
import { CalendarEvent } from '@/types/calendar';

interface DateTimeSelectionStepProps extends BookingStepProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  availableTimeSlots: string[];
  isLoadingTimeSlots: boolean;
  isCheckingDates: boolean;
  isDateDisabled: (date: Date) => boolean;
  timeSlotError?: string | null;
  onRetry?: () => void;
  selectedBarberId?: string | null;
  serviceDuration?: number;
  existingBookings?: any[];
  allEvents?: CalendarEvent[];
}

const DateTimeSelectionStep: React.FC<DateTimeSelectionStepProps> = ({ 
  selectedDate, 
  setSelectedDate, 
  selectedTime, 
  setSelectedTime, 
  onNext,
  onBack,
  availableTimeSlots,
  isLoadingTimeSlots,
  isCheckingDates,
  isDateDisabled,
  timeSlotError,
  onRetry,
  // We don't need to destructure allEvents since it's not directly used in this component
}) => {
  const handleRetry = () => {
    // Force clear any cached time slots to ensure fresh data
    try {
      // Access any global cache clearing functions
      const clearCacheFn = (window as any).__clearTimeSlotCache;
      if (typeof clearCacheFn === 'function') {
        clearCacheFn();
        console.log('Time slot cache cleared successfully');
      }
    } catch (e) {
      console.log('Cache clearing not available');
    }
    
    // Re-trigger the date selection to refresh time slots
    if (onRetry) {
      console.log('Calling onRetry to refresh time slots');
      onRetry();
    } else if (selectedDate) {
      // Force a refresh by briefly clearing and resetting the date
      console.log('Forcing refresh by resetting date temporarily');
      const refreshDate = new Date(selectedDate);
      setSelectedDate(undefined);
      setTimeout(() => setSelectedDate(refreshDate), 100);
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
