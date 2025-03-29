
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Booking, LunchBreak } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';
import { bookingToCalendarEvent, createLunchBreakEvent, createHolidayEvent } from '@/utils/calendarUtils';
import { formatNewBookingDate, formatNewBookingTime } from '@/utils/bookingUpdateUtils';

export const useCalendarBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lunchBreaks, setLunchBreaks] = useState<LunchBreak[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  const lastRefreshTime = useRef<number>(Date.now());
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingChangesRef = useRef<boolean>(false);

  // Update filteredEvents to properly filter by barber ID and current view date
  const filteredEvents = useMemo(() => {
    if (!calendarEvents.length) {
      console.log('No calendar events available to filter');
      return [];
    }
    
    // First, filter by barber if a barber is selected
    const barberFiltered = selectedBarberId 
      ? calendarEvents.filter(event => {
          // Make sure barberId is a string and matches exactly
          return event.barberId === selectedBarberId;
        })
      : calendarEvents;
    
    // Log the filtered events for debugging
    console.log(`Filtered events: ${barberFiltered.length} out of ${calendarEvents.length} total events`);
    
    return barberFiltered;
  }, [calendarEvents, selectedBarberId]);

  const fetchData = useCallback(async (dateRange?: { start: Date; end: Date }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching calendar data for date:', currentViewDate);
      
      // Optional date range filtering
      const dateFilter = dateRange ? {
        booking_date: {
          gte: formatNewBookingDate(dateRange.start),
          lte: formatNewBookingDate(dateRange.end)
        }
      } : {};
      
      // Step 1: Fetch bookings with barber and service info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(id, name, color),
          service:service_id(name, price, duration)
        `)
        .neq('status', 'cancelled')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });
      
      if (bookingsError) throw bookingsError;
      
      console.log('Fetched bookings:', bookingsData?.length || 0);
      
      // Step 2: Fetch profiles for all user IDs
      // Get unique user IDs from bookings (excluding guest bookings which have no valid user_id)
      const userIds = bookingsData
        ?.filter(booking => !booking.guest_booking)
        .map(booking => booking.user_id)
        .filter((id, index, self) => id && self.indexOf(id) === index) || [];
      
      // Fetch profiles for these user IDs
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }
      
      // Create a map of user_id to profile for easy lookup
      const profilesMap = new Map();
      profilesData?.forEach(profile => {
        profilesMap.set(profile.id, profile);
      });
      
      // Combine bookings with their profiles
      const bookingsWithProfiles = bookingsData?.map(booking => {
        // Ensure barber_id property is correctly preserved
        if (!booking.barber || !booking.barber.id) {
          console.warn('Missing barber data for booking:', booking.id);
        }
        
        if (booking.guest_booking) {
          return booking;
        }
        return {
          ...booking,
          profile: profilesMap.get(booking.user_id) || null
        };
      }) || [];
      
      setBookings(bookingsWithProfiles as Booking[]);
      
      // Continue with lunch breaks and holidays fetching
      const { data: lunchData, error: lunchError } = await supabase
        .from('barber_lunch_breaks')
        .select(`
          *,
          barber:barber_id(id, name, color)
        `)
        .eq('is_active', true);
        
      if (lunchError) throw lunchError;
      
      console.log('Fetched lunch breaks:', lunchData?.length || 0);
      setLunchBreaks(lunchData || []);
      
      const { data: holidaysData, error: holidaysError } = await supabase
        .from('barber_holidays')
        .select(`
          *,
          barber:barber_id(id, name, color)
        `)
        .order('start_date', { ascending: true });
        
      if (holidaysError) throw holidaysError;
      
      console.log('Fetched holidays:', holidaysData?.length || 0);
      setHolidays(holidaysData || []);
      
      // Create calendar events with proper barber IDs
      const bookingEvents = (bookingsWithProfiles || []).map(booking => {
        try {
          // Ensure we're using the barber ID correctly
          const barberId = booking.barber?.id || booking.barber_id;
          const event = bookingToCalendarEvent(booking as Booking);
          
          // Double-check barberId is correctly set
          if (event && event.barberId !== barberId) {
            console.warn(`Barber ID mismatch for booking ${booking.id}: expected ${barberId}, got ${event.barberId}`);
            // Ensure the barberId is set correctly
            return {
              ...event,
              barberId: barberId
            };
          }
          
          return event;
        } catch (err) {
          console.error('Error converting booking to event:', err, booking);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      // Process lunch breaks
      const lunchEvents = (lunchData || []).map(lunchBreak => {
        try {
          return createLunchBreakEvent(lunchBreak);
        } catch (err) {
          console.error('Error converting lunch break to event:', err, lunchBreak);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      // Process holidays
      const holidayEvents = (holidaysData || []).map(holiday => {
        try {
          return createHolidayEvent(holiday, holiday.barber);
        } catch (err) {
          console.error('Error converting holiday to event:', err, holiday);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      // Combine all events
      const allEvents = [...bookingEvents, ...holidayEvents, ...lunchEvents];
      console.log(`Total events created: ${allEvents.length}`);
      
      setCalendarEvents(allEvents);
      
      // Reset the pending changes flag after a successful data fetch
      pendingChangesRef.current = false;
      
      // Reset the last refresh time
      lastRefreshTime.current = Date.now();
    } catch (err: any) {
      console.error('Error fetching calendar data:', err);
      setError(err.message);
      toast.error('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  }, [currentViewDate]);

  // Handler for processing booking changes
  const handleBookingChange = useCallback((payload: any) => {
    // Mark that changes are pending
    pendingChangesRef.current = true;
    console.log('Booking change detected, marked for next scheduled refresh');
  }, []);

  // Handler for processing lunch break changes
  const handleLunchBreakChange = useCallback((payload: any) => {
    // Mark that changes are pending
    pendingChangesRef.current = true;
    console.log('Lunch break change detected, marked for next scheduled refresh');
  }, []);

  // Handler for processing holiday changes
  const handleHolidayChange = useCallback((payload: any) => {
    // Mark that changes are pending
    pendingChangesRef.current = true;
    console.log('Holiday change detected, marked for next scheduled refresh');
  }, []);

  // Schedule periodic refresh every minute
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastRefresh = now - lastRefreshTime.current;
      
      // Only refresh if either:
      // 1. It's been more than 60 seconds since the last refresh, or
      // 2. There are pending changes that need to be applied
      if (timeSinceLastRefresh > 60000 || pendingChangesRef.current) {
        console.log(`Scheduled refresh triggered. Time since last refresh: ${timeSinceLastRefresh}ms, Pending changes: ${pendingChangesRef.current}`);
        fetchData();
      } else {
        console.log(`Skipping refresh. Time since last refresh: ${timeSinceLastRefresh}ms, Pending changes: ${pendingChangesRef.current}`);
      }
    }, 10000); // Check every 10 seconds, but only actually refresh based on the conditions above
    
    refreshIntervalRef.current = refreshInterval;
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add this effect to handle date changes
  useEffect(() => {
    // When the date changes, refresh the calendar data
    console.log('Current view date changed:', currentViewDate);
    fetchData();
  }, [currentViewDate, fetchData]);

  const updateBookingTime = async (eventId: string, newStart: Date, newEnd: Date) => {
    try {
      if (eventId.startsWith('lunch-')) {
        toast.error('Lunch breaks cannot be moved. Please edit them in the barber settings.');
        return false;
      }
      
      const newBookingDate = formatNewBookingDate(newStart);
      const newBookingTime = formatNewBookingTime(newStart);
      
      console.log(`Updating booking ${eventId} to ${newBookingDate} ${newBookingTime}`);
      
      try {
        const event = calendarEvents.find(e => e.id === eventId);
        if (!event) {
          throw new Error('Event not found');
        }
        
        const serviceDuration = Math.round((event.end.getTime() - event.start.getTime()) / (1000 * 60));
        
        const { data: validationData, error: validationError } = await supabase.functions.invoke(
          'get-available-time-slots', 
          {
            body: {
              barberId: event.barberId,
              date: newStart.toISOString(),
              serviceDuration: serviceDuration,
              excludeBookingId: eventId
            }
          }
        );
        
        if (validationError) {
          throw validationError;
        }
        
        const timeSlot = newBookingTime;
        const availableSlots = validationData?.timeSlots || [];
        
        if (!availableSlots.includes(timeSlot)) {
          toast.error('This time slot is not available. Please choose another time.');
          return false;
        }
      } catch (validationErr) {
        console.error('Error validating time slot:', validationErr);
        toast.error('Could not validate time slot availability');
        return false;
      }
      
      // Update the calendarEvents state immediately for better UI responsiveness
      setCalendarEvents(prev => 
        prev.map(e => {
          if (e.id === eventId) {
            return {
              ...e,
              start: newStart,
              end: newEnd
            };
          }
          return e;
        })
      );
      
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: newBookingDate,
          booking_time: newBookingTime
        })
        .eq('id', eventId);
      
      if (error) {
        // If there's an error, revert the UI by refetching the data
        await fetchData();
        throw error;
      }
      
      toast.success('Booking time updated successfully');
      
      // Add a small delay before refresh to ensure the database has updated
      setTimeout(() => {
        fetchData();
      }, 1000);
      
      return true;
    } catch (err: any) {
      console.error('Error updating booking time:', err);
      toast.error('Failed to update booking time');
      return false;
    }
  };

  const updateBooking = async (
    bookingId: string, 
    updates: { 
      title?: string; 
      barber_id?: string; 
      service_id?: string; 
      notes?: string;
      booking_date?: string;
      booking_time?: string;
      status?: string;
    }
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      console.log(`Updating booking ${bookingId} with:`, updates);
      
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);
      
      if (error) throw error;
      
      // Schedule a refresh after a short delay to ensure changes are reflected
      setTimeout(() => {
        fetchData();
      }, 1000);
      
      toast.success('Booking updated successfully');
      return true;
    } catch (err: any) {
      console.error('Error updating booking:', err);
      setError(err.message);
      toast.error('Failed to update booking');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventDrop = (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    if (event.status === 'lunch-break' || event.id.startsWith('lunch-')) {
      toast.error('Lunch breaks cannot be moved. Please edit them in the barber settings.');
      return;
    }
    
    if (event.status === 'holiday') {
      toast.error('Holiday events cannot be moved. Please edit them in the barber settings.');
      return;
    }
    
    updateBookingTime(event.id, newStart, newEnd);
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.status === 'lunch-break' || event.id.startsWith('lunch-')) {
      toast.info(`${event.barber}'s lunch break: ${event.title}`);
      return;
    }
    
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  // Set up real-time subscriptions but with more efficient handling
  useEffect(() => {
    // Set up more efficient realtime subscriptions
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        handleBookingChange
      )
      .subscribe();
      
    const lunchChannel = supabase
      .channel('lunch-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barber_lunch_breaks' },
        handleLunchBreakChange
      )
      .subscribe();
      
    const holidaysChannel = supabase
      .channel('holidays-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barber_holidays' },
        handleHolidayChange
      )
      .subscribe();

    console.log('Subscribed to calendar data changes with optimized handlers');

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(lunchChannel);
      supabase.removeChannel(holidaysChannel);
      
      // Clear the refresh interval
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [handleBookingChange, handleLunchBreakChange, handleHolidayChange]);

  // Function to manually trigger a refresh (with debounce)
  const manualRefresh = useCallback(() => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTime.current;
    
    // Enforce a minimum delay between manual refreshes
    if (timeSinceLastRefresh < 3000) {
      console.log(`Manual refresh throttled. Last refresh was ${timeSinceLastRefresh}ms ago`);
      return;
    }
    
    console.log('Manual refresh triggered');
    fetchData();
  }, [fetchData]);

  return {
    bookings,
    holidays,
    calendarEvents: filteredEvents,
    isLoading,
    error,
    fetchBookings: fetchData,
    handleEventDrop,
    handleEventClick,
    updateBooking,
    selectedEvent,
    setSelectedEvent,
    isDialogOpen,
    setIsDialogOpen,
    selectedBarberId,
    setSelectedBarberId,
    allEvents: calendarEvents,
    setCurrentViewDate,
    manualRefresh
  };
};
