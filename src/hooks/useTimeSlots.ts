
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
 * Custom hook to calculate available time slots for a barber on a specific date
 * 
 * @param selectedDate - The selected date
 * @param selectedBarberId - The ID of the selected barber
 * @param selectedService - The selected service
 * @param existingBookings - Array of existing bookings
 * @param calendarEvents - Array of calendar events
 * @returns Object with time slots, loading state, error, and recalculate function
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
      const lunchBreaks = await fetchBarberLunchBreaks(selectedBarberId);
      console.log(`Fetched lunch breaks:`, lunchBreaks);
      setCachedLunchBreaks(lunchBreaks);
    };
    
    loadLunchBreaks();
  }, [selectedBarberId]);

  // The main calculation function, optimized
  const calculateAvailableTimeSlots = useCallback(async () => {
    if (!selectedDate || !selectedBarberId || !selectedService) {
      setTimeSlots([]);
      setError(null);
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
        return;
      }
      
      // Ensure we have lunch breaks loaded
      let lunchBreaks = cachedLunchBreaks;
      if (!lunchBreaks || lunchBreaks.length === 0) {
        console.log("No cached lunch breaks, fetching them...");
        lunchBreaks = await fetchBarberLunchBreaks(selectedBarberId);
        setCachedLunchBreaks(lunchBreaks);
      }
      
      // Fetch all possible time slots
      console.log(`Fetching time slots from service with duration: ${selectedService.duration}`);
      const slots = await fetchBarberTimeSlots(
        selectedBarberId, 
        selectedDate, 
        selectedService.duration,
        existingBookings,
        lunchBreaks || []
      );
      
      console.log(`Initial time slots (${slots.length}):`, slots);
      
      // Additional manual filtering for lunch breaks - this is a critical second check
      const filteredSlots = slots.filter(timeSlot => {
        // Check if the time slot is during a lunch break
        const hasLunchBreak = isLunchBreak(
          timeSlot,
          lunchBreaks || [],
          selectedService.duration
        );
        
        if (hasLunchBreak) {
          console.log(`Filtering out ${timeSlot} due to lunch break overlap in useTimeSlots hook`);
          return false;
        }
        
        return true;
      });
      
      console.log(`After lunch break filtering (${filteredSlots.length}):`, filteredSlots);
      
      // Filter out time slots that are in the past (for today only)
      const finalSlots = filteredSlots.filter(
        timeSlot => !isTimeSlotInPast(selectedDate, timeSlot)
      );
      
      console.log(`Final available time slots (${finalSlots.length}):`, finalSlots);
      
      // Cache the result
      calculationCache.current.set(cacheKey, finalSlots);
      
      setTimeSlots(finalSlots);
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
