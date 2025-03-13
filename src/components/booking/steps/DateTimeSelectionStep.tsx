
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BookingStepProps } from '@/types/booking';
import TimeSlot from '../TimeSlot';
import { Spinner } from '@/components/ui/spinner';

interface DateTimeSelectionStepProps extends BookingStepProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  isTimeSlotBooked?: (time: string) => boolean;
  onNext: () => void;
  onBack: () => void;
  availableTimeSlots: string[];
  isLoadingTimeSlots: boolean;
  isCheckingDates: boolean;
  isDateDisabled: (date: Date) => boolean;
  allEvents?: any;
  selectedBarberId?: string;
  serviceDuration?: number;
  existingBookings?: any[];
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
  isDateDisabled
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4 font-playfair">Select Date</h3>
          <div className="relative">
            {isCheckingDates && (
              <div className="absolute inset-0 bg-background/70 flex justify-center items-center z-10 rounded-md">
                <div className="flex items-center space-x-2">
                  <Spinner className="h-8 w-8" />
                  <span className="text-sm">Checking availability...</span>
                </div>
              </div>
            )}
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              className="rounded-md border pointer-events-auto"
            />
          </div>
        </div>

        {selectedDate && (
          <div>
            <h3 className="text-xl font-bold mb-4 font-playfair">Select Time</h3>
            
            {isLoadingTimeSlots ? (
              <div className="flex justify-center items-center h-48">
                <Spinner className="h-8 w-8" />
              </div>
            ) : availableTimeSlots.length === 0 ? (
              <div className="text-center p-4 border rounded-md bg-muted">
                <p className="text-muted-foreground">No available time slots for this date.</p>
                <p className="text-sm mt-2">Please select another date or barber.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableTimeSlots.map((time) => (
                  <TimeSlot 
                    key={time} 
                    time={time} 
                    selected={selectedTime === time}
                    onClick={() => setSelectedTime(time)}
                    disabled={false} // Already filtered out unavailable slots
                  />
                ))}
              </div>
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
