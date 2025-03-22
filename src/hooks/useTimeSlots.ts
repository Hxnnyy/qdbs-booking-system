
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

// Create a cache outside of the hook to persist across renders
const timeSlotCache = new Map<string, string[]>();

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
  
  // Cache reference moved outside the hook to prevent invalid hook calls
  const calculationCacheRef = useRef<Map<string, string[]>>(timeSlotCache);
  
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
      console.log(`Fetching barbers for service: ${serviceId}`);
      
      // Get barbers who offer this service
      const { data: barberServiceLinks, error } = await supabase
        .from('barber_services')
        .select('barber_id')
        .eq('service_id', serviceId);
        
      if (error) throw error;
      
      if (!barberServiceLinks || barberServiceLinks.length === 0) {
        console.log('No explicit service links found, checking for active barbers');
        // If no explicit links, check for active barbers
        const { data: activeBarbers, error: barberError } = await supabase
          .from('barbers')
          .select('id')
          .eq('active', true);
          
        if (barberError) throw barberError;
        
        const barberIds = activeBarbers?.map(b => b.id) || [];
        console.log(`Found ${barberIds.length} active barbers`);
        return barberIds;
      }
      
      // Verify these barbers are active
      const barberIds = barberServiceLinks.map(link => link.barber_id);
      console.log(`Found ${barberIds.length} barbers linked to this service, verifying they're active`);
      
      const { data: activeBarbers, error: barberError } = await supabase
        .from('barbers')
        .select('id')
        .in('id', barberIds)
        .eq('active', true);
        
      if (barberError) throw barberError;
      
      const activeBarberIds = activeBarbers?.map(b => b.id) || [];
      console.log(`After filtering, found ${activeBarberIds.length} active barbers for this service`);
      return activeBarberIds;
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
    console.log(`Calculating availability for ${barberIds.length} barbers on ${date.toDateString()}`);
    
    if (!barberIds.length) {
      console.log('No barbers available for this service');
      return { timeSlots: [], selectedBarber: null };
    }
    
    // For each barber, calculate available slots
    const barberSlots: {barberId: string, slots: string[]}[] = [];
    const allLunchBreaks = new Map<string, any[]>();
    
    // Prefetch lunch breaks for all barbers to reduce API calls
    for (const barberId of barberIds) {
      const lunchBreaks = await fetchBarberLunchBreaks(barberId);
      allLunchBreaks.set(barberId, lunchBreaks);
    }
    
    console.log(`Prefetched lunch breaks for ${allLunchBreaks.size} barbers`);
    
    for (const barberId of barberIds) {
      try {
        // Check if barber is on holiday
        const { isAvailable, errorMessage } = checkBarberAvailability(date, barberId, calendarEvents);
        if (!isAvailable) {
          console.log(`Barber ${barberId} is not available: ${errorMessage}`);
          continue;
        }
        
        // Get lunch breaks for this barber
        const lunchBreaks = allLunchBreaks.get(barberId) || [];
        
        // Filter existing bookings to only include this barber's bookings
        const barberBookings = existingBookings.filter(booking => 
          booking.barber_id === barberId
        );
        
        console.log(`Fetching time slots for barber ${barberId}`);
        
        // Calculate available slots
        const slots = await fetchBarberTimeSlots(
          barberId,
          date,
          service.duration,
          barberBookings,
          lunchBreaks
        );
        
        console.log(`Found ${slots.length} raw slots for barber ${barberId}`);
        
        // Filter past time slots
        const filteredSlots = slots.filter(
          timeSlot => !isTimeSlotInPast(date, timeSlot)
        );
        
        console.log(`After filtering past slots: ${filteredSlots.length} slots for barber ${barberId}`);
        
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
    
    console.log(`Found available slots for ${barberSlots.length} barbers`);
    
    // If no barbers are available, return empty array
    if (barberSlots.length === 0) {
      return { timeSlots: [], selectedBarber: null };
    }
    
    // Sort barbers by number of available slots (descending)
    barberSlots.sort((a, b) => b.slots.length - a.slots.length);
    
    // Select the barber with the most available slots
    const selectedBarber = barberSlots[0].barberId;
    const availableTimeSlots = barberSlots[0].slots;
    
    console.log(`Selected barber ${selectedBarber} with ${availableTimeSlots.length} slots`);
    
    return { timeSlots: availableTimeSlots, selectedBarber };
  };

  // The main calculation function, optimized to prevent infinite loops
  const calculateAvailableTimeSlots = useCallback(async () => {
    if (!selectedDate || !selectedBarberId || !selectedService) {
      setTimeSlots([]);
      setError(null);
      return;
    }
    
    setIsCalculating(true);
    setError(null);
    
    try {
      console.log(`Calculating time slots for date: ${selectedDate.toISOString()}, barber: ${selectedBarberId}, service: ${selectedService.id}`);
      
      // Handle "any barber" selection
      if (selectedBarberId === 'any') {
        // Create a cache key based on the date and service
        const cacheKey = `any_${selectedDate.toISOString()}_${selectedService.id}`;
        
        // Check if we have cached results
        if (calculationCacheRef.current.has(cacheKey)) {
          console.log('Using cached results for any barber calculation');
          const cachedResult = calculationCacheRef.current.get(cacheKey) || [];
          setTimeSlots(cachedResult);
          setIsCalculating(false);
          return;
        }
        
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
        
        // Cache the result
        calculationCacheRef.current.set(cacheKey, availableSlots);
        
        if (availableSlots.length === 0) {
          setError('No available time slots for any barber on this date.');
          setTimeSlots([]);
        } else {
          setTimeSlots(availableSlots);
        }
      } else {
        // Regular flow for a specific barber
        // Create a cache key based on the date, barber, and service
        const cacheKey = `${selectedDate.toISOString()}_${selectedBarberId}_${selectedService.id}`;
        
        // Check if we have cached results
        if (calculationCacheRef.current.has(cacheKey)) {
          console.log('Using cached results for specific barber calculation');
          const cachedResult = calculationCacheRef.current.get(cacheKey) || [];
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
        calculationCacheRef.current.set(cacheKey, filteredSlots);
        
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

  // Run the calculation only when dependencies change and avoid infinite loops
  useEffect(() => {
    // Create a consistent identifier for the current state to detect real changes
    const currentState = JSON.stringify({
      date: selectedDate?.toISOString(),
      barberId: selectedBarberId,
      serviceId: selectedService?.id
    });
    
    // Only run if there's an actual change in relevant state
    calculateAvailableTimeSlots();
  }, [calculateAvailableTimeSlots, selectedDate, selectedBarberId, selectedService]);

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
