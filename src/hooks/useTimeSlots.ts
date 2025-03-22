
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

// Create a timestamp to track the "freshness" of the cache
let globalCacheTimestamp = Date.now();

// Global function to clear the cache - used by other components
if (typeof window !== 'undefined') {
  (window as any).__clearTimeSlotCache = () => {
    console.log('Clearing time slot cache from global function');
    calculationCache.clear();
    globalCacheTimestamp = Date.now();
    return true;
  };
}

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
  
  // Local timestamp to track cache freshness for this hook instance
  const localCacheTimestampRef = useRef<number>(globalCacheTimestamp);
  
  // Load lunch breaks when barber changes
  useEffect(() => {
    if (!selectedBarberId) {
      setCachedLunchBreaks(null);
      return;
    }
    
    const loadLunchBreaks = async () => {
      try {
        console.log(`Loading lunch breaks for barber ${selectedBarberId}`);
        setIsCalculating(true);
        
        const lunchBreaks = await fetchBarberLunchBreaks(selectedBarberId);
        
        // Detailed logging of lunch breaks
        console.log(`Loaded ${lunchBreaks.length} lunch breaks for barber ${selectedBarberId}`);
        const activeBreaks = lunchBreaks.filter(b => b.is_active);
        console.log(`Active lunch breaks: ${activeBreaks.length}`);
        
        activeBreaks.forEach(breakTime => {
          console.log(`Active break: ${breakTime.start_time} (${breakTime.duration}min)`);
        });
        
        setCachedLunchBreaks(lunchBreaks);
        
        // Update our local timestamp to invalidate cache
        localCacheTimestampRef.current = Date.now();
        
        // Force clear cache when lunch breaks are loaded/changed
        calculationCache.clear();
      } catch (err) {
        console.error('Error loading lunch breaks:', err);
        toast.error('Failed to load lunch break settings');
      } finally {
        setIsCalculating(false);
      }
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
    const formattedDate = selectedDate.toISOString().split('T')[0];
    const activeBreaksString = cachedLunchBreaks 
      ? cachedLunchBreaks
          .filter(b => b.is_active)
          .map(b => `${b.id}_${b.start_time}_${b.duration}`)
          .join('|') 
      : 'no-breaks';
    
    // Include timestamps in the cache key to ensure freshness
    const cacheKey = `${formattedDate}_${selectedBarberId}_${selectedService.id}_${localCacheTimestampRef.current}_${activeBreaksString}_${globalCacheTimestamp}`;
    
    console.log(`Cache key for time slots: ${cacheKey}`);
    
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
      const availabilityResult = await checkBarberAvailability(
        selectedDate, 
        selectedBarberId, 
        calendarEvents
      );
      
      // Fixed: Properly handling the promise result
      if (!availabilityResult.isAvailable) {
        console.log('Barber not available:', availabilityResult.errorMessage);
        setError(availabilityResult.errorMessage);
        setTimeSlots([]);
        setIsCalculating(false);
        return;
      }
      
      console.log(`Fetching time slots for date: ${formattedDate}, barber: ${selectedBarberId}, service: ${selectedService.id}`);
      console.log(`Service duration: ${selectedService.duration} minutes`);
      console.log(`Lunch breaks: ${cachedLunchBreaks?.length || 0} (${cachedLunchBreaks?.filter(b => b.is_active).length || 0} active)`);
      
      // Use the time slot service with fresh lunch break data
      const availableSlots = await fetchBarberTimeSlots(
        selectedBarberId, 
        selectedDate, 
        selectedService.duration,
        existingBookings,
        cachedLunchBreaks || []
      );
      
      // Cache the result
      calculationCache.set(cacheKey, availableSlots);
      
      console.log(`Final time slots: ${availableSlots.length}`);
      if (availableSlots.length > 0) {
        console.log(`Available slots: ${availableSlots.join(', ')}`);
      }
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
    localCacheTimestampRef.current = Date.now();
    globalCacheTimestamp = Date.now();
  }, []);

  // Method to force reload lunch breaks data
  const reloadLunchBreaks = useCallback(async () => {
    if (!selectedBarberId) return;
    
    console.log('Forcing reload of lunch breaks data');
    setIsCalculating(true);
    
    try {
      const lunchBreaks = await fetchBarberLunchBreaks(selectedBarberId);
      console.log(`Reloaded ${lunchBreaks.length} lunch breaks`);
      
      setCachedLunchBreaks(lunchBreaks);
      
      // Update timestamps to invalidate cache
      localCacheTimestampRef.current = Date.now();
      globalCacheTimestamp = Date.now();
      
      clearCache(); // Clear the entire cache to ensure fresh data
      calculationCache.clear(); // Make doubly sure the cache is cleared
      calculateAvailableTimeSlots(); // Recalculate with fresh data
    } catch (error) {
      console.error('Error reloading lunch breaks:', error);
      toast.error('Failed to reload lunch break settings');
    } finally {
      setIsCalculating(false);
    }
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
