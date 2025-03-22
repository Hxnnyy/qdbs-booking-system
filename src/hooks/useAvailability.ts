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

  // Check if a date is selectable in the calendar
  const checkDateSelectable = useCallback(async (date: Date) => {
    if (!selectedBarberId) return false;
    
    const dateStr = format(date, 'yyyy-MM-dd');
    const cacheKey = `${dateStr}_${selectedBarberId}`;
    
    // Check cache first
    if (dateSelectionCache.has(cacheKey)) {
      return dateSelectionCache.get(cacheKey) || false;
    }
    
    // Otherwise check availability
    const selectable = await isDateSelectable(date, selectedBarberId, calendarEvents);
    
    // Cache the result
    dateSelectionCache.set(cacheKey, selectable);
    
    return selectable;
  }, [selectedBarberId, calendarEvents]);

  // Function to check if a date is disabled in the calendar
  const isDateDisabled = useCallback(async (date: Date) => {
    setIsCheckingDates(true);
    
    try {
      const selectable = await checkDateSelectable(date);
      return !selectable;
    } catch (err) {
      console.error('Error checking date selectability:', err);
      return true; // Disable by default on error
    } finally {
      setIsCheckingDates(false);
    }
  }, [checkDateSelectable]);

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
