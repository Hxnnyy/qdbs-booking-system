
import React from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BookingStepProps } from '@/types/booking';
import TimeSlot from '../TimeSlot';
import { CalendarEvent } from '@/types/calendar';
import { Spinner } from '@/components/ui/spinner';
import { ExistingBooking } from '@/types/booking';

interface DateTimeSelectionStepProps extends BookingStepProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  isTimeSlotBooked: (time: string) => boolean;
  allEvents?: CalendarEvent[];
  selectedBarberId?: string | null;
  serviceDuration?: number;
  existingBookings?: ExistingBooking[];
  availableTimeSlots: string[];
  isLoadingTimeSlots: boolean;
  isCheckingDates: boolean;
  isDateDisabled: (date: Date) => boolean;
}

const DateTimeSelectionStep: React.FC<DateTimeSelectionStepProps> = ({ 
  selectedDate, 
  setSelectedDate, 
  selectedTime, 
  setSelectedTime, 
  isTimeSlotBooked,
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
          {isCheckingDates ? (
            <div className="flex justify-center items-center h-48">
              <Spinner className="h-8 w-8" />
              <span className="ml-2">Checking availability...</span>
            </div>
          ) : (
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              className="rounded-md border"
            />
          )}
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
