
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { format, addDays, isBefore, startOfToday, addMonths } from 'date-fns';
import { BookingStepProps } from '@/types/booking';
import TimeSlot from '../TimeSlot';
import { CalendarEvent } from '@/types/calendar';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { isWithinOpeningHours, hasAvailableSlotsOnDay } from '@/utils/bookingUtils';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';

interface DateTimeSelectionStepProps extends BookingStepProps {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | null;
  setSelectedTime: (time: string) => void;
  isTimeSlotBooked: (time: string) => boolean;
  allEvents?: CalendarEvent[];
  selectedBarberId?: string;
  serviceDuration?: number;
  existingBookings?: any[];
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
  serviceDuration = 60,
  existingBookings = []
}) => {
  const today = startOfToday();
  const maxDate = addMonths(today, 6); // Changed from 30 days to 6 months
  
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [isCheckingDates, setIsCheckingDates] = useState<boolean>(false);
  
  // Fetch barber's time slots based on opening hours
  const fetchBarberTimeSlots = async (barberId: string, date: Date) => {
    try {
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Get opening hours for this barber and day
      const { data, error } = await supabase
        .from('opening_hours')
        .select('*')
        .eq('barber_id', barberId)
        .eq('day_of_week', dayOfWeek)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      // If no opening hours found or barber is closed on this day
      if (!data || data.is_closed) {
        return [];
      }
      
      // Generate time slots based on opening hours
      const slots = [];
      let currentTime = data.open_time;
      const closeTime = data.close_time;
      
      // Parse hours and minutes
      let [openHours, openMinutes] = currentTime.split(':').map(Number);
      const [closeHours, closeMinutes] = closeTime.split(':').map(Number);
      
      // Calculate end time in minutes for comparison
      const closeTimeInMinutes = closeHours * 60 + closeMinutes;
      
      // Generate slots in 30-minute increments
      while (true) {
        const timeInMinutes = openHours * 60 + openMinutes;
        if (timeInMinutes >= closeTimeInMinutes) {
          break;
        }
        
        // Format time as "HH:MM"
        const formattedHours = openHours.toString().padStart(2, '0');
        const formattedMinutes = openMinutes.toString().padStart(2, '0');
        slots.push(`${formattedHours}:${formattedMinutes}`);
        
        // Increment by 30 minutes
        openMinutes += 30;
        if (openMinutes >= 60) {
          openHours += 1;
          openMinutes -= 60;
        }
      }
      
      return slots;
    } catch (error) {
      console.error('Error fetching barber time slots:', error);
      return [];
    }
  };

  // Function to check if a date should be disabled
  const shouldDisableDate = (date: Date) => {
    // Check if date is before today or after max booking window
    if (isBefore(date, today) || isBefore(maxDate, date)) {
      return true;
    }
    
    // Check if the barber is on holiday for this date
    return isBarberHolidayDate(allEvents, date, selectedBarberId);
  };
  
  // Pre-check available days for the selected month
  useEffect(() => {
    const checkMonthAvailability = async () => {
      if (!selectedBarberId) return;
      
      setIsCheckingDates(true);
      
      try {
        // Generate dates for current month view
        const daysToCheck = [];
        const currentDate = new Date(today);
        
        // Check next 30 days
        for (let i = 0; i < 30; i++) {
          const dateToCheck = new Date(currentDate);
          dateToCheck.setDate(currentDate.getDate() + i);
          
          if (!shouldDisableDate(dateToCheck)) {
            daysToCheck.push(dateToCheck);
          }
        }
        
        // Check each date for availability
        const unavailableDays = [];
        
        for (const date of daysToCheck) {
          const hasSlots = await hasAvailableSlotsOnDay(
            selectedBarberId, 
            date, 
            existingBookings,
            serviceDuration
          );
          
          if (!hasSlots) {
            unavailableDays.push(date);
          }
        }
        
        setDisabledDates(unavailableDays);
      } catch (error) {
        console.error('Error checking month availability:', error);
      } finally {
        setIsCheckingDates(false);
      }
    };
    
    checkMonthAvailability();
  }, [selectedBarberId, serviceDuration]);
  
  // Filter time slots based on barber availability
  useEffect(() => {
    const filterTimeSlots = async () => {
      if (!selectedDate || !selectedBarberId) {
        setAvailableTimeSlots([]);
        return;
      }
      
      setIsLoadingTimeSlots(true);
      
      try {
        // First, get the barber's time slots based on opening hours
        const barberTimeSlots = await fetchBarberTimeSlots(selectedBarberId, selectedDate);
        
        if (barberTimeSlots.length === 0) {
          setAvailableTimeSlots([]);
          setIsLoadingTimeSlots(false);
          return;
        }
        
        const availableSlots = [];
        
        for (const time of barberTimeSlots) {
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

  const isDateDisabled = (date: Date) => {
    // Basic checks first
    if (shouldDisableDate(date)) {
      return true;
    }
    
    // Then check our pre-computed unavailable days
    return disabledDates.some(disabledDate => 
      disabledDate.getDate() === date.getDate() && 
      disabledDate.getMonth() === date.getMonth() && 
      disabledDate.getFullYear() === date.getFullYear()
    );
  };

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
