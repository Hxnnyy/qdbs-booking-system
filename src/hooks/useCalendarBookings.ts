import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, parseISO, addMinutes } from 'date-fns';
import { toast } from 'sonner';
import { CalendarEvent } from '@/types/calendar';
import { useQueryClient } from '@tanstack/react-query';
import { getEventColor } from '@/utils/eventColorUtils';
import { createEventsFromBookings } from '@/utils/eventCreationUtils';
import { getBarberColor } from '@/utils/barberColorUtils';

export const useCalendarBookings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();
  const prevEventsRef = useRef<{ [key: string]: CalendarEvent }>({});
  
  // Use a map for faster lookup instead of array operations
  const eventsMap = useRef<{ [key: string]: CalendarEvent }>({});
  
  // Subscription references to clean up properly
  const subscriptionRefs = useRef<{
    bookings?: any;
    lunchBreaks?: any;
    holidays?: any;
  }>({});

  // Throttle state to prevent excessive updates
  const throttleRef = useRef<{
    lastUpdate: number;
    pendingUpdate: boolean;
    updateTimeout: NodeJS.Timeout | null;
  }>({
    lastUpdate: 0,
    pendingUpdate: false,
    updateTimeout: null
  });

  // Create event map for faster lookups
  const updateEventsMap = useCallback((events: CalendarEvent[]) => {
    const newMap: { [key: string]: CalendarEvent } = {};
    events.forEach(event => {
      newMap[event.id] = event;
    });
    eventsMap.current = newMap;
    prevEventsRef.current = { ...newMap };
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Use a single promise.all for parallel requests
      const [bookingsResponse, lunchBreaksResponse, holidaysResponse, barbersResponse] = await Promise.all([
        supabase
          .from('bookings')
          .select('*, barbers(name, color), services(name, duration)')
          .order('booking_date', { ascending: true }),
        
        supabase
          .from('barber_lunch_breaks')
          .select('*, barbers(name, color)')
          .eq('is_active', true),
          
        supabase
          .from('barber_holidays')
          .select('*, barbers(name)')
          .gte('end_date', new Date().toISOString().split('T')[0]),
          
        supabase
          .from('barbers')
          .select('id, name, color')
          .eq('active', true)
      ]);

      if (bookingsResponse.error) throw bookingsResponse.error;
      if (lunchBreaksResponse.error) throw lunchBreaksResponse.error;
      if (holidaysResponse.error) throw holidaysResponse.error;
      if (barbersResponse.error) throw barbersResponse.error;

      // Create a mapping of barber IDs to colors for faster lookups
      const barberColors: { [key: string]: string } = {};
      barbersResponse.data.forEach(barber => {
        barberColors[barber.id] = barber.color || getBarberColor(barber.id);
      });

      // Process all data at once and create calendar events
      const allEvents = createEventsFromBookings(
        bookingsResponse.data,
        lunchBreaksResponse.data,
        holidaysResponse.data,
        barberColors
      );
      
      // Filter events by selected barber if needed
      const filteredEvents = selectedBarberId 
        ? allEvents.filter(event => event.barberId === selectedBarberId)
        : allEvents;
      
      // Update events map for faster lookups
      updateEventsMap(filteredEvents);
      
      setCalendarEvents(filteredEvents);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      toast.error('Failed to load calendar data');
      setIsLoading(false);
    }
  }, [selectedBarberId, updateEventsMap]);

  // Optimized handler for real-time updates
  const handleRealtimeChange = useCallback((payload: any) => {
    // Throttle updates to prevent excessive re-renders
    const now = Date.now();
    if (now - throttleRef.current.lastUpdate < 300) {
      // If we've updated recently, queue an update instead of doing it immediately
      if (!throttleRef.current.pendingUpdate) {
        throttleRef.current.pendingUpdate = true;
        
        if (throttleRef.current.updateTimeout) {
          clearTimeout(throttleRef.current.updateTimeout);
        }
        
        throttleRef.current.updateTimeout = setTimeout(() => {
          fetchData();
          throttleRef.current.lastUpdate = Date.now();
          throttleRef.current.pendingUpdate = false;
          throttleRef.current.updateTimeout = null;
        }, 300);
      }
      return;
    }

    // Update timestamp for throttling
    throttleRef.current.lastUpdate = now;
    
    try {
      // For now, we'll still do a full refetch but with throttling
      // This could be further optimized by implementing incremental updates
      fetchData();
    } catch (error) {
      console.error('Error handling realtime update:', error);
    }
  }, [fetchData]);

  // Setup realtime subscriptions
  useEffect(() => {
    // Initial data fetch
    fetchData();

    // Set up realtime subscriptions with optimized channel usage
    const bookingsChannel = supabase
      .channel('admin-calendar-bookings')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings'
      }, handleRealtimeChange)
      .subscribe();

    const lunchBreaksChannel = supabase
      .channel('admin-calendar-lunch-breaks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'barber_lunch_breaks'
      }, handleRealtimeChange)
      .subscribe();

    const holidaysChannel = supabase
      .channel('admin-calendar-holidays')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'barber_holidays'
      }, handleRealtimeChange)
      .subscribe();

    // Save subscription references for cleanup
    subscriptionRefs.current = {
      bookings: bookingsChannel,
      lunchBreaks: lunchBreaksChannel,
      holidays: holidaysChannel
    };

    // Clean up subscriptions
    return () => {
      if (subscriptionRefs.current.bookings) {
        supabase.removeChannel(subscriptionRefs.current.bookings);
      }
      if (subscriptionRefs.current.lunchBreaks) {
        supabase.removeChannel(subscriptionRefs.current.lunchBreaks);
      }
      if (subscriptionRefs.current.holidays) {
        supabase.removeChannel(subscriptionRefs.current.holidays);
      }
      
      // Clear any pending timeout
      if (throttleRef.current.updateTimeout) {
        clearTimeout(throttleRef.current.updateTimeout);
      }
    };
  }, [fetchData, handleRealtimeChange, selectedBarberId]);

  // Handler for when an event is clicked
  const handleEventClick = useCallback((event: CalendarEvent) => {
    if (event.status === 'lunch-break' || event.status === 'holiday') {
      return;
    }
    
    setSelectedEvent(event);
    setIsDialogOpen(true);
  }, []);

  // Handler for drag and drop
  const handleEventDrop = useCallback(async (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    try {
      // Format the new date and time
      const newBookingDate = format(newStart, 'yyyy-MM-dd');
      const newBookingTime = format(newStart, 'HH:mm');
      
      // Optimistic update to UI first
      setCalendarEvents(prev => 
        prev.map(e => {
          if (e.id === event.id) {
            return {
              ...e,
              start: newStart,
              end: newEnd
            };
          }
          return e;
        })
      );
      
      // Update the booking in the database
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: newBookingDate,
          booking_time: newBookingTime
        })
        .eq('id', event.id);
      
      if (error) throw error;
      
      toast.success('Appointment rescheduled');
      
      // No need to fetch all data again, the subscription will handle it
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to reschedule appointment');
      
      // Revert the UI state on error
      fetchData();
    }
  }, [fetchData]);

  // Function to update a booking
  const updateBooking = useCallback(async (bookingId: string, updates: any) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast.success('Booking updated successfully');
      
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: ['admin-bookings']
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking');
      return { success: false, error };
    }
  }, [queryClient]);

  // Exposed API - IMPORTANT: Add allEvents alias for backward compatibility
  return {
    calendarEvents,
    allEvents: calendarEvents, // Add this alias to fix the errors
    isLoading,
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
    currentViewDate,
    setCurrentViewDate
  };
};
