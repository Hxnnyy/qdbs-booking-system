
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
import { supabase } from '@/integrations/supabase/client';
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
  const [selectedBarberForBooking, setSelectedBarberForBooking] = useState<string | null>(null);
  
  // Cache to avoid recalculation
  const calculationCache = useRef<Map<string, string[]>>(new Map());
  
  // Pre-fetch lunch breaks for this barber
  useEffect(() => {
    if (!selectedBarberId || selectedBarberId === 'any' || cachedLunchBreaks !== null) return;
    
    const loadLunchBreaks = async () => {
      const lunchBreaks = await fetchBarberLunchBreaks(selectedBarberId);
      setCachedLunchBreaks(lunchBreaks);
    };
    
    loadLunchBreaks();
  }, [selectedBarberId, cachedLunchBreaks]);

  // Fetch available barbers for a service
  const fetchBarbersForService = async (serviceId: string): Promise<string[]> => {
    try {
      // Get barbers who offer this service
      const { data: barberServiceLinks, error } = await supabase
        .from('barber_services')
        .select('barber_id')
        .eq('service_id', serviceId);
        
      if (error) throw error;
      
      if (!barberServiceLinks || barberServiceLinks.length === 0) {
        // If no explicit links, check for active barbers
        const { data: activeBarbers, error: barberError } = await supabase
          .from('barbers')
          .select('id')
          .eq('active', true);
          
        if (barberError) throw barberError;
        return activeBarbers?.map(b => b.id) || [];
      }
      
      // Verify these barbers are active
      const barberIds = barberServiceLinks.map(link => link.barber_id);
      
      const { data: activeBarbers, error: barberError } = await supabase
        .from('barbers')
        .select('id')
        .in('id', barberIds)
        .eq('active', true);
        
      if (barberError) throw barberError;
      
      return activeBarbers?.map(b => b.id) || [];
    } catch (err) {
      console.error('Error fetching barbers for service:', err);
      return [];
    }
  };

  // Calculate time slots for multiple barbers
  const calculateSlotsForMultipleBarbers = async (
    barberIds: string[],
    date: Date,
    service: Service
  ): Promise<{timeSlots: string[], selectedBarber: string | null}> => {
    if (!barberIds.length) {
      return { timeSlots: [], selectedBarber: null };
    }
    
    // For each barber, calculate available slots
    const barberSlots: {barberId: string, slots: string[]}[] = [];
    
    for (const barberId of barberIds) {
      try {
        // Check if barber is on holiday
        const { isAvailable } = checkBarberAvailability(date, barberId, calendarEvents);
        if (!isAvailable) continue;
        
        // Get lunch breaks for this barber
        const lunchBreaks = await fetchBarberLunchBreaks(barberId);
        
        // Get existing bookings for this barber
        const barberBookings = existingBookings.filter(booking => 
          booking.barber_id === barberId
        );
        
        // Calculate available slots
        const slots = await fetchBarberTimeSlots(
          barberId,
          date,
          service.duration,
          barberBookings,
          lunchBreaks
        );
        
        // Filter past time slots
        const filteredSlots = slots.filter(
          timeSlot => !isTimeSlotInPast(date, timeSlot)
        );
        
        if (filteredSlots.length > 0) {
          barberSlots.push({
            barberId,
            slots: filteredSlots
          });
        }
      } catch (err) {
        console.error(`Error calculating slots for barber ${barberId}:`, err);
        // Continue with next barber
      }
    }
    
    // If no barbers are available, return empty array
    if (barberSlots.length === 0) {
      return { timeSlots: [], selectedBarber: null };
    }
    
    // Sort barbers by number of available slots (descending)
    barberSlots.sort((a, b) => b.slots.length - a.slots.length);
    
    // Select the barber with the most available slots
    const selectedBarber = barberSlots[0].barberId;
    const availableTimeSlots = barberSlots[0].slots;
    
    return { timeSlots: availableTimeSlots, selectedBarber };
  };

  // The main calculation function, optimized
  const calculateAvailableTimeSlots = useCallback(async () => {
    if (!selectedDate || !selectedBarberId || !selectedService) {
      setTimeSlots([]);
      setError(null);
      return;
    }
    
    setIsCalculating(true);
    setError(null);
    
    try {
      console.log(`Calculating time slots for date: ${selectedDate}, barber: ${selectedBarberId}, service: ${selectedService.id}`);
      
      // Handle "any barber" selection
      if (selectedBarberId === 'any') {
        // Get all barbers who can perform this service
        const eligibleBarbers = await fetchBarbersForService(selectedService.id);
        
        console.log(`Eligible barbers for service ${selectedService.id}:`, eligibleBarbers);
        
        if (eligibleBarbers.length === 0) {
          setError('No barbers available for this service.');
          setTimeSlots([]);
          setIsCalculating(false);
          return;
        }
        
        // Calculate slots for all eligible barbers
        const { timeSlots: availableSlots, selectedBarber } = await calculateSlotsForMultipleBarbers(
          eligibleBarbers,
          selectedDate,
          selectedService
        );
        
        console.log(`Selected barber from multiple options: ${selectedBarber}`);
        console.log(`Available slots: ${availableSlots.length}`);
        
        // Store the selected barber for later use
        setSelectedBarberForBooking(selectedBarber);
        
        if (availableSlots.length === 0) {
          setError('No available time slots for any barber on this date.');
          setTimeSlots([]);
          setIsCalculating(false);
          return;
        }
        
        setTimeSlots(availableSlots);
      } else {
        // Regular flow for a specific barber
        // Create a cache key based on the date, barber, and service
        const cacheKey = `${selectedDate.toISOString()}_${selectedBarberId}_${selectedService.id}`;
        
        // Check if we have cached results
        if (calculationCache.current.has(cacheKey)) {
          const cachedResult = calculationCache.current.get(cacheKey) || [];
          setTimeSlots(cachedResult);
          setSelectedBarberForBooking(selectedBarberId);
          setIsCalculating(false);
          return;
        }
        
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
        
        console.log(`Filtered slots: ${filteredSlots.length}`);
        
        // Cache the result
        calculationCache.current.set(cacheKey, filteredSlots);
        
        setTimeSlots(filteredSlots);
        setSelectedBarberForBooking(selectedBarberId);
      }
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
    recalculate: calculateAvailableTimeSlots,
    selectedBarberForBooking
  };
};

// Export for compatibility with existing code
export { fetchBarberTimeSlots } from '@/services/timeSlotService';
