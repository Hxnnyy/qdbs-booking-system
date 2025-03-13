
import { useState, useEffect, useCallback } from 'react';
import { isBefore, startOfToday, addMonths } from 'date-fns';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { CalendarEvent } from '@/types/calendar';
import { hasAvailableSlotsOnDay } from '@/utils/bookingUtils';
import { ExistingBooking } from '@/types/booking';

export const useDateAvailability = (
  selectedBarber: string | null, 
  serviceDuration: number | undefined,
  allEvents: CalendarEvent[] = []
) => {
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [isCheckingDates, setIsCheckingDates] = useState<boolean>(false);
  
  const today = startOfToday();
  const maxDate = addMonths(today, 6);
  
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
    if (!selectedBarber || !serviceDuration) return;
    
    setIsCheckingDates(true);
    
    try {
      const daysToCheck = [];
      const currentDate = new Date(today);
      
      for (let i = 0; i < 30; i++) {
        const dateToCheck = new Date(currentDate);
        dateToCheck.setDate(currentDate.getDate() + i);
        
        if (!shouldDisableDate(dateToCheck)) {
          daysToCheck.push(dateToCheck);
        }
      }
      
      const unavailableDays = [];
      
      for (const date of daysToCheck) {
        const hasSlots = await hasAvailableSlotsOnDay(
          selectedBarber, 
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
  }, [selectedBarber, serviceDuration, today, shouldDisableDate]);
  
  return {
    isDateDisabled,
    disabledDates,
    isCheckingDates,
    today,
    maxDate,
    checkMonthAvailability,
    shouldDisableDate
  };
};
