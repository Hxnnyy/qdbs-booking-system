
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
  const lunchBreakTimestampRef = useRef<number>(Date.now());
  
  // Load lunch breaks when barber changes
  useEffect(() => {
    if (!selectedBarberId) {
      setCachedLunchBreaks(null);
      return;
    }
    
    const loadLunchBreaks = async () => {
      console.log(`Loading lunch breaks for barber ${selectedBarberId}`);
      setIsCalculating(true);
      const lunchBreaks = await fetchBarberLunchBreaks(selectedBarberId);
      console.log('Loaded lunch breaks:', lunchBreaks);
      setCachedLunchBreaks(lunchBreaks);
      lunchBreakTimestampRef.current = Date.now(); // Update timestamp on refresh
      setIsCalculating(false);
    };
    
    loadLunchBreaks();
  }, [selectedBarberId]);

  // Calculate available time slots
  const calculateAvailableTimeSlots = useCallback(async () => {
    if (!selectedDate || !selectedBarberId || !selectedService) {
      console.log('Missing required data for time slot calculation');
      setTimeSlots([]);
      setError(null);
      return;
    }
    
    setIsCalculating(true);
    setError(null);
    
    // Create a detailed cache key that includes lunch break information
    const activeLunchBreaks = cachedLunchBreaks 
      ? cachedLunchBreaks.filter(b => b.is_active).map(b => `${b.start_time}_${b.duration}`).join('|')
      : 'no-breaks';
    
    const cacheKey = `${selectedDate.toISOString()}_${selectedBarberId}_${selectedService.id}_${lunchBreakTimestampRef.current}_${activeLunchBreaks}`;
    
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
      
      console.log('Fetching time slots with lunch breaks:', {
        lunchBreakCount: cachedLunchBreaks?.length || 0,
        activeLunchBreaks: cachedLunchBreaks?.filter(b => b.is_active).length || 0
      });
      
      // Use the improved fetchBarberTimeSlots with lunch break filtering
      const availableSlots = await fetchBarberTimeSlots(
        selectedBarberId, 
        selectedDate, 
        selectedService.duration,
        existingBookings,
        cachedLunchBreaks || []
      );
      
      // Cache the result
      calculationCache.set(cacheKey, availableSlots);
      
      console.log(`Final time slots after all filtering: ${availableSlots.length}`);
      setTimeSlots(availableSlots);
    } catch (err) {
      console.error('Error calculating time slots:', err);
      setError('Failed to load available time slots');
      toast.error('Failed to load available time slots');
    } finally {
      setIsCalculating(false);
    }
  }, [selectedDate, selectedBarberId, selectedService, existingBookings, calendarEvents, cachedLunchBreaks]);

  // Calculate slots whenever dependencies change
  useEffect(() => {
    calculateAvailableTimeSlots();
  }, [calculateAvailableTimeSlots]);

  // Method to clear the cache when needed
  const clearCache = useCallback(() => {
    console.log('Clearing time slot calculation cache');
    calculationCache.clear();
  }, []);

  // Method to force reload lunch breaks data
  const reloadLunchBreaks = useCallback(async () => {
    if (!selectedBarberId) return;
    
    console.log('Forcing reload of lunch breaks data');
    const lunchBreaks = await fetchBarberLunchBreaks(selectedBarberId);
    console.log('Reloaded lunch breaks:', lunchBreaks);
    setCachedLunchBreaks(lunchBreaks);
    lunchBreakTimestampRef.current = Date.now(); // Update timestamp
    clearCache();
    calculateAvailableTimeSlots();
  }, [selectedBarberId, clearCache, calculateAvailableTimeSlots]);

  return {
    timeSlots,
    isCalculating,
    error,
    recalculate: calculateAvailableTimeSlots,
    clearCache,
    reloadLunchBreaks
  };
};

// Re-export for compatibility
export { fetchBarberTimeSlots } from '@/services/timeSlotService';
