
/**
 * useTimeSlots Hook
 * 
 * Custom hook to calculate available time slots for a barber on a specific date
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { CalendarEvent } from '@/types/calendar';
import { Service } from '@/supabase-types';
import { supabase } from '@/integrations/supabase/client';
import { checkBarberAvailability } from '@/services/timeSlotService';

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
  
  // Cache to avoid recalculation
  const calculationCache = useRef<Map<string, string[]>>(new Map());
  
  // Clear cache when barber or service changes
  useEffect(() => {
    calculationCache.current.clear();
  }, [selectedBarberId, selectedService?.id]);

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
      
      // Ensure we pass the correct date to the edge function
      // Important: Send the full ISO string without manipulating it to preserve the correct day
      const { data, error } = await supabase.functions.invoke('get-available-time-slots', {
        body: {
          barberId: selectedBarberId,
          date: selectedDate.toISOString(),
          serviceDuration: selectedService.duration
        }
      });
      
      if (error) {
        console.error('Error calling get-available-time-slots function:', error);
        setError('Failed to load available time slots');
        setTimeSlots([]);
        setIsCalculating(false);
        return;
      }
      
      console.log('Edge function response:', data);
      
      // Data should contain the timeSlots array
      if (data && Array.isArray(data.timeSlots)) {
        const availableSlots = data.timeSlots;
        console.log(`Received ${availableSlots.length} time slots from edge function`);
        
        // Cache the result
        calculationCache.current.set(cacheKey, availableSlots);
        setTimeSlots(availableSlots);
      } else {
        console.error('Invalid response from edge function:', data);
        setError('Failed to load available time slots');
        setTimeSlots([]);
      }
    } catch (err) {
      console.error('Error calculating time slots:', err);
      setError('Failed to load available time slots');
      toast.error('Failed to load available time slots');
    } finally {
      setIsCalculating(false);
    }
  }, [selectedDate, selectedBarberId, selectedService, calendarEvents]);

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

// Only export the needed function for compatibility
export { checkBarberAvailability } from '@/services/timeSlotService';
