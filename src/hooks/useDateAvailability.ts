
import { useState, useEffect } from 'react';
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
  const shouldDisableDate = (date: Date) => {
    if (isBefore(date, today) || isBefore(maxDate, date)) {
      return true;
    }
    
    if (selectedBarber) {
      return isBarberHolidayDate(allEvents, date, selectedBarber);
    }
    
    return false;
  };
  
  // Combined check that includes our computed unavailable days
  const isDateDisabled = (date: Date) => {
    if (shouldDisableDate(date)) {
      return true;
    }
    
    return disabledDates.some(disabledDate => 
      disabledDate.getDate() === date.getDate() && 
      disabledDate.getMonth() === date.getMonth() && 
      disabledDate.getFullYear() === date.getFullYear()
    );
  };
  
  // Check available days for the selected month
  useEffect(() => {
    const checkMonthAvailability = async (
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
    };
    
    return { checkMonthAvailability };
  }, [selectedBarber, serviceDuration, today, maxDate, allEvents]);
  
  return {
    isDateDisabled,
    disabledDates,
    isCheckingDates,
    today,
    maxDate
  };
};
