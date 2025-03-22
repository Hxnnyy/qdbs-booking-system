
/**
 * useTimeSlots Hook
 * 
 * Custom hook to calculate available time slots for a barber on a specific date
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';
import { CalendarEvent } from '@/types/calendar';
import { Service } from '@/supabase-types';
import { fetchBarberTimeSlots, fetchBarberLunchBreaks, checkBarberAvailability } from '@/services/timeSlotService';
import { isLunchBreak } from '@/utils/timeSlotUtils';

/**
 * Create a "fake booking" from a lunch break to use with existing booking filtering logic
 */
const createFakeLunchBooking = (lunchBreak: any) => {
  if (!lunchBreak.is_active) {
    return null;
  }
  
  return {
    booking_time: lunchBreak.start_time,
    services: {
      duration: lunchBreak.duration
    }
  };
};

/**
 * Custom hook to calculate available time slots for a barber on a specific date
 */
export const useTimeSlots = (
  selectedDate: Date | undefined,
  selectedBarberId: string | null,
  selectedService: Service | null,
  existingBookings: any[],
  calendarEvents: CalendarEvent[] = []
) => {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedLunchBreaks, setCachedLunchBreaks] = useState<any[] | null>(null);
  
  // Cache to avoid recalculation
  const calculationCache = useRef<Map<string, string[]>>(new Map());
  
  // Clear cache when barber or service changes
  useEffect(() => {
    calculationCache.current.clear();
    setCachedLunchBreaks(null);
  }, [selectedBarberId, selectedService?.id]);
  
  // Pre-fetch lunch breaks for this barber
  useEffect(() => {
    if (!selectedBarberId) return;
    
    const loadLunchBreaks = async () => {
      console.log(`Fetching lunch breaks for barber ${selectedBarberId}`);
      try {
        const lunchBreaks = await fetchBarberLunchBreaks(selectedBarberId);
        console.log(`LUNCH BREAKS FETCHED:`, lunchBreaks);
        setCachedLunchBreaks(lunchBreaks);
      } catch (err) {
        console.error("Error fetching lunch breaks:", err);
        // Don't block the flow on lunch break fetch errors
        setCachedLunchBreaks([]);
      }
    };
    
    loadLunchBreaks();
  }, [selectedBarberId]);

  // The main calculation function
  const calculateAvailableTimeSlots = useCallback(async () => {
    if (!selectedDate || !selectedBarberId || !selectedService) {
      setTimeSlots([]);
      setError(null);
      setIsCalculating(false);
      return;
    }
    
    setIsCalculating(true);
    setError(null);
    
    // Create a cache key based on the date, barber, and service
    const cacheKey = `${selectedDate.toISOString()}_${selectedBarberId}_${selectedService.id}`;
    
    // Check if we have cached results
    if (calculationCache.current.has(cacheKey)) {
      const cachedResult = calculationCache.current.get(cacheKey) || [];
      console.log(`Using cached time slots: ${cachedResult.length} slots`);
      setTimeSlots(cachedResult);
      setIsCalculating(false);
      return;
    }
    
    try {
      console.log(`Calculating time slots for date: ${selectedDate.toISOString()}, barber: ${selectedBarberId}, service: ${selectedService.name}, duration: ${selectedService.duration}min`);
      
      // Check barber availability for the selected date
      const { isAvailable, errorMessage } = checkBarberAvailability(
        selectedDate, 
        selectedBarberId, 
        calendarEvents
      );
      
      if (!isAvailable) {
        setError(errorMessage);
        setTimeSlots([]);
        setIsCalculating(false);
        return;
      }
      
      // Ensure we have lunch breaks loaded
      let lunchBreaks = cachedLunchBreaks;
      if (!lunchBreaks) {
        console.log("No cached lunch breaks, fetching them...");
        try {
          lunchBreaks = await fetchBarberLunchBreaks(selectedBarberId);
          setCachedLunchBreaks(lunchBreaks);
          console.log("LUNCH BREAKS FETCHED IN CALCULATION:", lunchBreaks);
        } catch (err) {
          console.error("Error fetching lunch breaks:", err);
          // Don't block on lunch break fetch errors
          lunchBreaks = [];
        }
      }
      
      // Only consider active lunch breaks
      const activeLunchBreaks = lunchBreaks?.filter(lb => lb.is_active) || [];
      console.log(`Found ${activeLunchBreaks.length} active lunch breaks for barber ${selectedBarberId}`);
      
      // Create combined bookings by treating lunch breaks as bookings
      const combinedBookings = [...existingBookings];
      
      // Add active lunch breaks as fake bookings
      activeLunchBreaks.forEach(lunchBreak => {
        const fakeBooking = createFakeLunchBooking(lunchBreak);
        if (fakeBooking) {
          combinedBookings.push(fakeBooking);
          console.log(`Added lunch break at ${lunchBreak.start_time} for ${lunchBreak.duration}min as a booking`);
        }
      });
      
      // Fetch all possible time slots, passing the combined bookings list
      console.log(`Fetching time slots with service duration: ${selectedService.duration}`);
      const fetchedTimeSlots = await fetchBarberTimeSlots(
        selectedBarberId, 
        selectedDate, 
        selectedService.duration,
        combinedBookings, 
        [] // Empty lunch breaks since we're treating them as bookings already
      );
      
      console.log(`Initial time slots (${fetchedTimeSlots.length}):`, fetchedTimeSlots);
      
      // Final filter: remove time slots in the past
      const finalSlots = fetchedTimeSlots.filter(
        timeSlot => !isTimeSlotInPast(selectedDate, timeSlot)
      );
      
      // Extra verification step - double check for lunch break overlaps
      const verifiedSlots = finalSlots.filter(timeSlot => {
        const overlapsLunch = isLunchBreak(timeSlot, activeLunchBreaks, selectedService.duration);
        if (overlapsLunch) {
          console.log(`VERIFICATION REMOVED: ${timeSlot} overlaps with lunch break`);
        }
        return !overlapsLunch;
      });
      
      console.log(`Final available time slots (${verifiedSlots.length}):`, verifiedSlots);
      
      // Cache the result
      calculationCache.current.set(cacheKey, verifiedSlots);
      
      setTimeSlots(verifiedSlots);
    } catch (err) {
      console.error('Error calculating time slots:', err);
      setError('Failed to load available time slots');
      toast.error('Failed to load available time slots');
    } finally {
      setIsCalculating(false);
    }
  }, [selectedDate, selectedBarberId, selectedService, existingBookings, calendarEvents, cachedLunchBreaks]);

  // Recalculate when dependencies change
  useEffect(() => {
    calculateAvailableTimeSlots();
  }, [calculateAvailableTimeSlots]);

  // Provide a method to force recalculation
  const recalculate = useCallback(() => {
    // Clear the cache for the current parameters
    if (selectedDate && selectedBarberId && selectedService) {
      const cacheKey = `${selectedDate.toISOString()}_${selectedBarberId}_${selectedService.id}`;
      calculationCache.current.delete(cacheKey);
    }
    calculateAvailableTimeSlots();
  }, [selectedDate, selectedBarberId, selectedService, calculateAvailableTimeSlots]);

  return {
    timeSlots,
    isCalculating,
    error,
    recalculate
  };
};

// Export for compatibility with existing code
export { fetchBarberTimeSlots } from '@/services/timeSlotService';
