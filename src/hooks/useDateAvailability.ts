
import { useState, useEffect, useCallback } from 'react';
import { isBefore, startOfToday, addMonths } from 'date-fns';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { CalendarEvent } from '@/types/calendar';
import { hasAvailableSlotsOnDay } from '@/utils/bookingUtils';
import { ExistingBooking } from '@/types/booking';
import { toast } from 'sonner';

export const useDateAvailability = (
  selectedBarber: string | null, 
  serviceDuration: number | undefined,
  allEvents: CalendarEvent[] = []
) => {
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [isCheckingDates, setIsCheckingDates] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const today = startOfToday();
  const maxDate = addMonths(today, 6);
  
  // Reset error state function
  const resetCalendarError = useCallback(() => {
    setError(null);
  }, []);
  
  // Basic date validation check
  const shouldDisableDate = useCallback((date: Date) => {
    if (isBefore(date, today) || isBefore(maxDate, date)) {
      return true;
    }
    
    if (selectedBarber) {
      return isBarberHolidayDate(allEvents, date, selectedBarber);
    }
    
    return false;
  }, [selectedBarber, today, maxDate, allEvents]);
  
  // Combined check that includes our computed unavailable days
  const isDateDisabled = useCallback((date: Date) => {
    if (shouldDisableDate(date)) {
      return true;
    }
    
    return disabledDates.some(disabledDate => 
      disabledDate.getDate() === date.getDate() && 
      disabledDate.getMonth() === date.getMonth() && 
      disabledDate.getFullYear() === date.getFullYear()
    );
  }, [shouldDisableDate, disabledDates]);
  
  // Define checkMonthAvailability with useCallback to properly memoize it
  const checkMonthAvailability = useCallback(async (
    existingBookings: ExistingBooking[] = []
  ) => {
    // Reset error state before starting
    setError(null);
    
    // Early return if prerequisites aren't met
    if (!selectedBarber || !serviceDuration) {
      console.log("Early return from checkMonthAvailability - missing barber or service duration");
      setIsCheckingDates(false);
      return;
    }
    
    setIsCheckingDates(true);
    
    try {
      console.log("Starting availability check with barber:", selectedBarber, "service duration:", serviceDuration);
      
      // Add a small delay to ensure UI updates properly
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const daysToCheck = [];
      const currentDate = new Date(today);
      
      // Only check availability for the next 30 days to improve performance
      for (let i = 0; i < 30; i++) {
        const dateToCheck = new Date(currentDate);
        dateToCheck.setDate(currentDate.getDate() + i);
        
        if (!shouldDisableDate(dateToCheck)) {
          daysToCheck.push(dateToCheck);
        }
      }
      
      // If no days to check, finish early
      if (daysToCheck.length === 0) {
        console.log("No days to check after filtering holidays");
        setIsCheckingDates(false);
        return;
      }
      
      const unavailableDays: Date[] = [];
      
      // Process in smaller batches to avoid UI freezing
      const batchSize = 5;
      for (let i = 0; i < daysToCheck.length; i += batchSize) {
        // Set a timeout for each batch to prevent long-running operations
        const batchTimeout = setTimeout(() => {
          console.log("Batch operation timed out");
          setIsCheckingDates(false);
          setError("Operation timed out. Please try again.");
          toast.error("Calendar availability check timed out. Please try again.");
        }, 15000); // 15 second timeout, increased from 10 seconds
        
        const batch = daysToCheck.slice(i, i + batchSize);
        
        // Prevent infinite loops by checking if component is still mounted
        if (!batch.length) continue;
        
        try {
          // Process batch in parallel for better performance
          const results = await Promise.all(
            batch.map(async (date) => {
              try {
                console.log("Checking slots for date:", date);
                const hasSlots = await hasAvailableSlotsOnDay(
                  selectedBarber, 
                  date, 
                  existingBookings,
                  serviceDuration
                );
                
                return { date, hasSlots };
              } catch (error) {
                console.error(`Error checking slots for date ${date}:`, error);
                // On error, assume there are slots to prevent blocking the UI
                return { date, hasSlots: true };
              }
            })
          );
          
          // Clear the timeout as the batch completed successfully
          clearTimeout(batchTimeout);
          
          // Filter out days with no available slots
          results.forEach(({ date, hasSlots }) => {
            if (!hasSlots) {
              unavailableDays.push(date);
            }
          });
        } catch (error) {
          clearTimeout(batchTimeout);
          console.error('Error processing batch:', error);
          // Continue to next batch on error
        }
      }
      
      console.log("Finished availability check, unavailable days:", unavailableDays.length);
      setDisabledDates(unavailableDays);
      setIsCheckingDates(false);
    } catch (error: any) {
      console.error('Error checking month availability:', error);
      setError(error.message || "Failed to load calendar data");
      setIsCheckingDates(false);
      toast.error("Failed to load calendar. Please try again.");
    }
  }, [selectedBarber, serviceDuration, today, shouldDisableDate]);
  
  return {
    isDateDisabled,
    disabledDates,
    isCheckingDates,
    error,
    today,
    maxDate,
    checkMonthAvailability,
    shouldDisableDate,
    resetCalendarError
  };
};
