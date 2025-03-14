
import { useState, useEffect, useCallback, useRef } from 'react';
import { addDays, addMonths, format, isSameDay } from 'date-fns';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { hasAvailableSlotsOnDay } from '@/utils/bookingUtils';
import { isSameDay as isSameDayUtil } from '@/utils/bookingUpdateUtils';
import { CalendarEvent } from '@/types/calendar';
import { supabase } from '@/integrations/supabase/client';

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
  const [cachedOpeningHours, setCachedOpeningHours] = useState<any | null>(null);
  
  // Use refs to avoid unnecessary hook recalculations
  const barberIdRef = useRef(barberId);
  const checkInProgress = useRef(false);
  
  // Pre-cache the barber's opening hours for faster availability checks
  useEffect(() => {
    if (!barberId || cachedOpeningHours) return;
    
    const fetchOpeningHours = async () => {
      try {
        const { data, error } = await supabase
          .from('opening_hours')
          .select('*')
          .eq('barber_id', barberId);
          
        if (error) throw error;
        setCachedOpeningHours(data || []);
      } catch (err) {
        console.error('Error fetching opening hours:', err);
      }
    };
    
    fetchOpeningHours();
  }, [barberId, cachedOpeningHours]);

  // Optimize checking day availability with cached opening hours
  const checkDayAvailabilityFast = useCallback(async (date: Date): Promise<boolean> => {
    if (!barberId || !serviceDuration) return false;
    
    // First check if the barber is on holiday
    if (isBarberHolidayDate(calendarEvents, date, barberId)) {
      return false;
    }
    
    // Quick check using cached opening hours
    if (cachedOpeningHours) {
      const dayOfWeek = date.getDay();
      const daySchedule = cachedOpeningHours.find((hour: any) => hour.day_of_week === dayOfWeek);
      
      // If no schedule found or barber is closed that day
      if (!daySchedule || daySchedule.is_closed) {
        return false;
      }
      
      // The barber has opening hours on this day, so it's potentially available
      return true;
    }
    
    // Fallback to original check if cache isn't ready
    return hasAvailableSlotsOnDay(
      barberId,
      date,
      existingBookings,
      serviceDuration
    );
  }, [barberId, serviceDuration, calendarEvents, existingBookings, cachedOpeningHours]);

  // Cache unavailable dates when component mounts or when dependencies change
  useEffect(() => {
    if (!barberId || !serviceDuration || checkInProgress.current) {
      return;
    }
    
    if (barberIdRef.current !== barberId) {
      // Reset cache when barber changes
      setUnavailableDates([]);
      barberIdRef.current = barberId;
    }
    
    const cacheUnavailableDates = async () => {
      setIsCheckingDates(true);
      checkInProgress.current = true;
      
      try {
        const unavailable: Date[] = [];
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Just check the next 30 days instead of 3 months to speed things up
        const maxDate = addDays(today, 30);
        
        // First, get all holidays in one go
        const barberHolidays = calendarEvents.filter(event => 
          event.type === 'holiday' && 
          event.barberId === barberId
        );
        
        // Create batch of dates to check in parallel
        const datePromises: Promise<{date: Date, available: boolean}>[] = [];
        
        for (let i = 0; i < 30; i++) {
          const checkDate = addDays(new Date(today), i);
          
          // First check if it's a holiday (which is fast)
          const isHoliday = isBarberHolidayDate(barberHolidays, checkDate, barberId);
          
          if (isHoliday) {
            unavailable.push(new Date(checkDate));
          } else {
            // Only do the more expensive check if it's not a holiday
            datePromises.push(
              checkDayAvailabilityFast(new Date(checkDate))
                .then(available => ({ date: new Date(checkDate), available }))
            );
          }
        }
        
        // Process all date checks in parallel (much faster)
        const results = await Promise.all(datePromises);
        
        results.forEach(result => {
          if (!result.available) {
            unavailable.push(result.date);
          }
        });
        
        setUnavailableDates(unavailable);
      } catch (error) {
        console.error('Error checking date availability:', error);
      } finally {
        setIsCheckingDates(false);
        checkInProgress.current = false;
      }
    };
    
    cacheUnavailableDates();
  }, [barberId, serviceDuration, calendarEvents, checkDayAvailabilityFast]);

  // Check if a date should be disabled
  const isDateDisabled = useCallback((date: Date): boolean => {
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
      isSameDayUtil(unavailableDate, date)
    );
  }, [unavailableDates, calendarEvents, barberId]);

  // Check availability for a specific date
  const checkDateAvailability = useCallback(async (date: Date): Promise<boolean> => {
    if (!barberId || !serviceDuration) return false;
    
    try {
      // First check if the barber is on holiday
      if (isBarberHolidayDate(calendarEvents, date, barberId)) {
        return false;
      }
      
      return checkDayAvailabilityFast(date);
    } catch (error) {
      console.error('Error checking date availability:', error);
      return false;
    }
  }, [barberId, serviceDuration, calendarEvents, checkDayAvailabilityFast]);

  return {
    isCheckingDates,
    unavailableDates,
    isDateDisabled,
    checkDateAvailability
  };
};
