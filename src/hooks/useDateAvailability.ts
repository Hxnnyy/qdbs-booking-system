
import { useState, useEffect } from 'react';
import { addDays, addMonths } from 'date-fns';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { hasAvailableSlotsOnDay } from '@/utils/bookingUtils';
import { isSameDay } from '@/utils/bookingUpdateUtils';
import { CalendarEvent } from '@/types/calendar';

/**
 * Custom hook to manage date availability and caching
 */
export const useDateAvailability = (
  barberId: string | null,
  serviceDuration: number | undefined,
  calendarEvents: CalendarEvent[] = [],
  existingBookings: any[] = []
) => {
  const [isCheckingDates, setIsCheckingDates] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);

  // Cache unavailable dates when component mounts or when dependencies change
  useEffect(() => {
    if (!barberId || !serviceDuration) {
      setUnavailableDates([]);
      return;
    }
    
    const cacheUnavailableDates = async () => {
      setIsCheckingDates(true);
      const unavailable: Date[] = [];
      
      const today = new Date();
      const maxDate = addMonths(today, 3);
      let checkDate = new Date(today);
      
      while (checkDate <= maxDate) {
        const isHoliday = isBarberHolidayDate(calendarEvents, checkDate, barberId);
        
        if (isHoliday) {
          unavailable.push(new Date(checkDate));
        } else {
          const hasAvailableSlots = await hasAvailableSlotsOnDay(
            barberId,
            new Date(checkDate), 
            existingBookings,
            serviceDuration
          );
          
          if (!hasAvailableSlots) {
            unavailable.push(new Date(checkDate));
          }
        }
        
        checkDate = addDays(checkDate, 1);
      }
      
      setUnavailableDates(unavailable);
      setIsCheckingDates(false);
    };
    
    cacheUnavailableDates();
  }, [barberId, serviceDuration, calendarEvents, existingBookings]);

  // Check if a date should be disabled
  const isDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return true;
    }
    
    // Check if barber is on holiday
    if (isBarberHolidayDate(calendarEvents, date, barberId)) {
      return true;
    }
    
    // Check if date is in the unavailable dates cache
    return unavailableDates.some(unavailableDate => 
      isSameDay(unavailableDate, date)
    );
  };

  // Check availability for a specific date
  const checkDateAvailability = async (date: Date): Promise<boolean> => {
    if (!barberId || !serviceDuration) return false;
    
    try {
      // First check if the barber is on holiday
      if (isBarberHolidayDate(calendarEvents, date, barberId)) {
        return false;
      }
      
      return await hasAvailableSlotsOnDay(
        barberId,
        date,
        existingBookings,
        serviceDuration
      );
    } catch (error) {
      console.error('Error checking date availability:', error);
      return false;
    }
  };

  return {
    isCheckingDates,
    unavailableDates,
    isDateDisabled,
    checkDateAvailability
  };
};
