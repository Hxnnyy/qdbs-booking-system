
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { format, addDays, isBefore, startOfToday, addMonths } from 'date-fns';
import { BookingStepProps } from '@/types/booking';
import TimeSlot from '../TimeSlot';
import { CalendarEvent } from '@/types/calendar';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { isWithinOpeningHours } from '@/utils/bookingUtils';
import { Spinner } from '@/components/ui/spinner';

interface DateTimeSelectionStepProps extends BookingStepProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  isTimeSlotBooked: (time: string) => boolean;
  allEvents?: CalendarEvent[];
  selectedBarberId?: string;
  serviceDuration?: number;
}

const DateTimeSelectionStep: React.FC<DateTimeSelectionStepProps> = ({ 
  selectedDate, 
  setSelectedDate, 
  selectedTime, 
  setSelectedTime, 
  isTimeSlotBooked,
  onNext,
  onBack,
  allEvents = [],
  selectedBarberId,
  serviceDuration = 60
}) => {
  const today = startOfToday();
  const maxDate = addMonths(today, 6); // Changed from 30 days to 6 months
  
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false);
  
  const allTimeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  // Function to check if a date should be disabled
  const shouldDisableDate = (date: Date) => {
    // Check if date is before today or after max booking window
    if (isBefore(date, today) || isBefore(maxDate, date)) {
      return true;
    }
    
    // Check if the barber is on holiday for this date
    return isBarberHolidayDate(allEvents, date, selectedBarberId);
  };
  
  // Filter time slots based on barber availability
  useEffect(() => {
    const filterTimeSlots = async () => {
      if (!selectedDate || !selectedBarberId) {
        setAvailableTimeSlots([]);
        return;
      }
      
      setIsLoadingTimeSlots(true);
      
      try {
        const availableSlots = [];
        
        for (const time of allTimeSlots) {
          // Check if the time slot is within opening hours and not booked
          const isAvailable = await isWithinOpeningHours(
            selectedBarberId,
            selectedDate,
            time,
            serviceDuration
          );
          
          if (isAvailable && !isTimeSlotBooked(time)) {
            availableSlots.push(time);
          }
        }
        
        setAvailableTimeSlots(availableSlots);
      } catch (error) {
        console.error('Error filtering time slots:', error);
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };
    
    filterTimeSlots();
  }, [selectedDate, selectedBarberId, serviceDuration, isTimeSlotBooked]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4 font-playfair">Select Date</h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={shouldDisableDate}
            className="rounded-md border"
          />
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
                    selected={selectedTime === time ? "true" : "false"} 
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
