import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { Service } from '@/supabase-types';
import { 
  fetchBarberTimeSlots, 
  fetchBarberLunchBreaks,
  checkBarberAvailability,
  isDateSelectable
} from '@/services/timeSlotService';
import { supabase } from '@/integrations/supabase/client';

// Create a cache for API results to reduce unnecessary calls
const timeSlotCache = new Map<string, string[]>();
const dateSelectionCache = new Map<string, boolean>();
// Cache for already-checked dates to avoid repeated async checks
const checkedDatesCache = new Map<string, boolean>();

/**
 * Custom hook to manage barber availability
 */
export const useAvailability = (
  selectedDate: Date | undefined,
  selectedBarberId: string | null,
  selectedService: Service | null,
  calendarEvents: CalendarEvent[] = []
) => {
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false);
  const [timeSlotError, setTimeSlotError] = useState<string | null>(null);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [lunchBreaks, setLunchBreaks] = useState<any[]>([]);
  const [isCheckingDates, setIsCheckingDates] = useState<boolean>(false);
  // Add state to track unavailable dates
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);

  // Generate a cache key for time slots
  const getTimeSlotCacheKey = useCallback(() => {
    if (!selectedDate || !selectedBarberId || !selectedService) return '';
    
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const serviceId = selectedService.id;
    const serviceDuration = selectedService.duration;
    
    // Include lunch break info in the cache key to ensure freshness
    const lunchBreakInfo = lunchBreaks
      .filter(b => b.is_active)
      .map(b => `${b.id}_${b.start_time}_${b.duration}`)
      .join('|');
    
    return `${dateStr}_${selectedBarberId}_${serviceId}_${serviceDuration}_${lunchBreakInfo}`;
  }, [selectedDate, selectedBarberId, selectedService, lunchBreaks]);

  // Clear all caches
  const clearCaches = useCallback(() => {
    console.log('Clearing all availability caches');
    timeSlotCache.clear();
    dateSelectionCache.clear();
    checkedDatesCache.clear();
  }, []);

  // Fetch existing bookings for the selected date and barber
  const fetchExistingBookings = useCallback(async () => {
    if (!selectedDate || !selectedBarberId) return [];
    
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_time, service_id, services(duration)')
        .eq('barber_id', selectedBarberId)
        .eq('booking_date', formattedDate)
        .eq('status', 'confirmed');
      
      if (error) throw error;
      
      console.log(`Fetched ${data?.length || 0} existing bookings for ${formattedDate}`);
      return data || [];
    } catch (err) {
      console.error('Error fetching existing bookings:', err);
      return [];
    }
  }, [selectedDate, selectedBarberId]);

  // Fetch lunch breaks for the selected barber
  const loadLunchBreaks = useCallback(async () => {
    if (!selectedBarberId) return;
    
    try {
      console.log(`Loading lunch breaks for barber ${selectedBarberId}`);
      const breaks = await fetchBarberLunchBreaks(selectedBarberId);
      setLunchBreaks(breaks);
      
      console.log(`Loaded ${breaks.length} lunch breaks`);
      const activeBreaks = breaks.filter(b => b.is_active);
      console.log(`Active lunch breaks: ${activeBreaks.length}`);
      
      // Clear caches when lunch breaks change
      clearCaches();
    } catch (err) {
      console.error('Error loading lunch breaks:', err);
    }
  }, [selectedBarberId, clearCaches]);

  // Fetch available time slots
  const fetchAvailableTimeSlots = useCallback(async () => {
    if (!selectedDate || !selectedBarberId || !selectedService) {
      setAvailableTimeSlots([]);
      setTimeSlotError(null);
      return;
    }
    
    setIsLoadingTimeSlots(true);
    setTimeSlotError(null);
    
    const cacheKey = getTimeSlotCacheKey();
    
    // Check if result is cached
    if (cacheKey && timeSlotCache.has(cacheKey)) {
      console.log('Using cached time slots');
      setAvailableTimeSlots(timeSlotCache.get(cacheKey) || []);
      setIsLoadingTimeSlots(false);
      return;
    }
    
    try {
      // First check barber availability
      const { isAvailable, errorMessage } = await checkBarberAvailability(
        selectedDate,
        selectedBarberId,
        calendarEvents
      );
      
      if (!isAvailable) {
        setTimeSlotError(errorMessage);
        setAvailableTimeSlots([]);
        setIsLoadingTimeSlots(false);
        return;
      }
      
      // Fetch existing bookings
      const bookings = await fetchExistingBookings();
      setExistingBookings(bookings);
      
      // Get available time slots
      const timeSlots = await fetchBarberTimeSlots(
        selectedBarberId,
        selectedDate,
        selectedService.duration,
        bookings,
        lunchBreaks
      );
      
      // Cache the result if we have a valid cache key
      if (cacheKey) {
        timeSlotCache.set(cacheKey, timeSlots);
      }
      
      setAvailableTimeSlots(timeSlots);
    } catch (err) {
      console.error('Error fetching available time slots:', err);
      setTimeSlotError('Failed to load available time slots');
    } finally {
      setIsLoadingTimeSlots(false);
    }
  }, [
    selectedDate, 
    selectedBarberId, 
    selectedService, 
    calendarEvents, 
    lunchBreaks, 
    getTimeSlotCacheKey, 
    fetchExistingBookings
  ]);

  // Prefetch and cache date availability information
  const prefetchDateAvailability = useCallback(async () => {
    if (!selectedBarberId || !selectedService) return;
    
    setIsCheckingDates(true);
    
    try {
      // Prepare a batch of dates to check (next 30 days)
      const today = new Date();
      const datesToCheck = [];
      
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(today.getDate() + i);
        datesToCheck.push(date);
      }
      
      // Check dates in parallel
      const results = await Promise.all(
        datesToCheck.map(async (date) => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const cacheKey = `${dateStr}_${selectedBarberId}`;
          
          // If already in cache, use cached result
          if (dateSelectionCache.has(cacheKey)) {
            return { 
              date, 
              available: dateSelectionCache.get(cacheKey) || false 
            };
          }
          
          // Otherwise check availability
          const available = await isDateSelectable(date, selectedBarberId, calendarEvents);
          
          // Cache the result
          dateSelectionCache.set(cacheKey, available);
          
          return { date, available };
        })
      );
      
      // Build unavailable dates array
      const newUnavailableDates = results
        .filter(result => !result.available)
        .map(result => result.date);
      
      setUnavailableDates(newUnavailableDates);
    } catch (err) {
      console.error('Error prefetching date availability:', err);
    } finally {
      setIsCheckingDates(false);
    }
  }, [selectedBarberId, selectedService, calendarEvents]);

  // Call prefetch on initial load and when dependencies change
  useEffect(() => {
    prefetchDateAvailability();
  }, [prefetchDateAvailability]);

  // Check if a date is selectable in the calendar - SYNCHRONOUS VERSION
  // This uses the prefetched data instead of making an async call each time
  const isDateDisabled = useCallback((date: Date): boolean => {
    if (!selectedBarberId) return true;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const cacheKey = `${dateStr}_${selectedBarberId}`;
    
    // Check if we have a cached result
    if (dateSelectionCache.has(cacheKey)) {
      // Return the opposite of availability (true if date should be disabled)
      return !dateSelectionCache.get(cacheKey);
    }
    
    // For dates we haven't checked yet, default to enabled
    // They'll be updated once the prefetch completes
    return false;
  }, [selectedBarberId]);

  // Load lunch breaks when barber changes
  useEffect(() => {
    loadLunchBreaks();
  }, [selectedBarberId, loadLunchBreaks]);

  // Fetch time slots when dependencies change
  useEffect(() => {
    fetchAvailableTimeSlots();
  }, [fetchAvailableTimeSlots]);

  // Setup global cache clearing function
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__clearAvailabilityCache = clearCaches;
    }
    
    // Listen for cache invalidation events
    const handleCacheInvalidation = () => {
      console.log('Cache invalidation event received');
      clearCaches();
      fetchAvailableTimeSlots();
    };
    
    window.addEventListener('availability-cache-invalidated', handleCacheInvalidation);
    
    return () => {
      window.removeEventListener('availability-cache-invalidated', handleCacheInvalidation);
    };
  }, [clearCaches, fetchAvailableTimeSlots]);

  return {
    availableTimeSlots,
    isLoadingTimeSlots,
    timeSlotError,
    isCheckingDates,
    isDateDisabled,
    refreshAvailability: fetchAvailableTimeSlots,
    clearCache: clearCaches
  };
};
