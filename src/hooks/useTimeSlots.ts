
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
  
  // Pre-fetch lunch breaks for this barber
  useEffect(() => {
    if (!selectedBarberId || cachedLunchBreaks !== null) return;
    
    const loadLunchBreaks = async () => {
      const lunchBreaks = await fetchBarberLunchBreaks(selectedBarberId);
      setCachedLunchBreaks(lunchBreaks);
    };
    
    loadLunchBreaks();
  }, [selectedBarberId, cachedLunchBreaks]);

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
      setTimeSlots(cachedResult);
      setIsCalculating(false);
      return;
    }
    
    try {
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
      
      const slots = await fetchBarberTimeSlots(
        selectedBarberId, 
        selectedDate, 
        selectedService.duration,
        existingBookings,
        cachedLunchBreaks || []
      );
      
      // Filter out time slots that are in the past (for today only)
      const filteredSlots = slots.filter(
        timeSlot => !isTimeSlotInPast(selectedDate, timeSlot)
      );
      
      // Cache the result
      calculationCache.current.set(cacheKey, filteredSlots);
      
      setTimeSlots(filteredSlots);
    } catch (err) {
      console.error('Error calculating time slots:', err);
      setError('Failed to load available time slots');
      toast.error('Failed to load available time slots');
    } finally {
      setIsCalculating(false);
    }
  }, [selectedDate, selectedBarberId, selectedService, existingBookings, calendarEvents, cachedLunchBreaks]);

  useEffect(() => {
    calculateAvailableTimeSlots();
  }, [calculateAvailableTimeSlots]);

  return {
    timeSlots,
    isCalculating,
    error,
    recalculate: calculateAvailableTimeSlots
  };
};

// Export for compatibility with existing code
export { fetchBarberTimeSlots } from '@/services/timeSlotService';
