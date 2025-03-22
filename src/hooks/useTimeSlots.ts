
/**
 * useTimeSlots Hook
 * 
 * Custom hook to calculate available time slots for a barber on a specific date
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';
import { CalendarEvent } from '@/types/calendar';
import { Service } from '@/supabase-types';
import { fetchBarberTimeSlots, fetchBarberLunchBreaks, checkBarberAvailability } from '@/services/timeSlotService';

// Create a module-level cache to persist data across renders
const calculationCache = new Map<string, string[]>();

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
  
  // Clear lunch breaks cache when barber changes
  useEffect(() => {
    if (!selectedBarberId) {
      setCachedLunchBreaks(null);
      return;
    }
    
    const loadLunchBreaks = async () => {
      console.log(`Loading lunch breaks for barber ${selectedBarberId}`);
      const lunchBreaks = await fetchBarberLunchBreaks(selectedBarberId);
      console.log('Loaded lunch breaks:', lunchBreaks);
      setCachedLunchBreaks(lunchBreaks);
    };
    
    loadLunchBreaks();
  }, [selectedBarberId]);

  // The main calculation function, optimized
  const calculateAvailableTimeSlots = useCallback(async () => {
    if (!selectedDate || !selectedBarberId || !selectedService) {
      console.log('Missing required data for time slot calculation');
      setTimeSlots([]);
      setError(null);
      return;
    }
    
    setIsCalculating(true);
    setError(null);
    
    // Create a cache key based on the date, barber, service, and lunch break data
    // Include lunch break data in the cache key to ensure recalculation if lunch breaks change
    const lunchBreakKey = cachedLunchBreaks ? 
      cachedLunchBreaks.map(b => `${b.id}-${b.start_time}-${b.duration}-${b.is_active}`).join(',') : 
      'no-breaks';
    const cacheKey = `${selectedDate.toISOString()}_${selectedBarberId}_${selectedService.id}_${lunchBreakKey}`;
    
    // Check if we have cached results
    if (calculationCache.has(cacheKey)) {
      console.log('Using cached time slots');
      const cachedResult = calculationCache.get(cacheKey) || [];
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
        console.log('Barber not available:', errorMessage);
        setError(errorMessage);
        setTimeSlots([]);
        setIsCalculating(false);
        return;
      }
      
      console.log('Fetching time slots with cached lunch breaks:', cachedLunchBreaks);
      
      // Fetch time slots, passing cached lunch breaks if available
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
      
      console.log(`After all filtering: ${filteredSlots.length} slots available`);
      
      // Cache the result
      calculationCache.set(cacheKey, filteredSlots);
      
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

  // Method to clear the cache when needed (like after booking)
  const clearCache = useCallback(() => {
    console.log('Clearing time slot calculation cache');
    calculationCache.clear();
  }, []);

  return {
    timeSlots,
    isCalculating,
    error,
    recalculate: calculateAvailableTimeSlots,
    clearCache
  };
};

// Export for compatibility with existing code
export { fetchBarberTimeSlots } from '@/services/timeSlotService';
