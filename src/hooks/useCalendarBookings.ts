
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Booking } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';
import { bookingToCalendarEvent, formatNewBookingDate, formatNewBookingTime } from '@/utils/calendarUtils';

export const useCalendarBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);

  // Fetch all bookings
  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching bookings...');
      
      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(name),
          service:service_id(name, price, duration)
        `)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });
      
      if (error) throw error;
      
      console.log(`Fetched ${data?.length || 0} bookings`);
      setBookings(data || []);
      
      // Convert bookings to calendar events
      const events = (data || []).map(booking => {
        try {
          return bookingToCalendarEvent(booking);
        } catch (err) {
          console.error('Error converting booking to event:', err, booking);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      console.log(`Created ${events.length} calendar events`);
      setCalendarEvents(events);
      
      // Apply barber filter if one is selected
      filterEventsByBarber(events, selectedBarberId);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, [selectedBarberId]);

  // Filter events by barber ID
  const filterEventsByBarber = useCallback((events: CalendarEvent[], barberId: string | null) => {
    if (!barberId) {
      setFilteredEvents(events);
      return;
    }
    
    const filtered = events.filter(event => event.barberId === barberId);
    setFilteredEvents(filtered);
  }, []);

  // Set selected barber filter
  const setBarberFilter = useCallback((barberId: string | null) => {
    setSelectedBarberId(barberId);
    filterEventsByBarber(calendarEvents, barberId);
  }, [calendarEvents, filterEventsByBarber]);

  // Clear barber filter
  const clearBarberFilter = useCallback(() => {
    setSelectedBarberId(null);
    setFilteredEvents(calendarEvents);
  }, [calendarEvents]);

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Update booking time/date (for drag and drop)
  const updateBookingTime = async (eventId: string, newStart: Date, newEnd: Date) => {
    try {
      setIsLoading(true);
      
      const newBookingDate = formatNewBookingDate(newStart);
      const newBookingTime = formatNewBookingTime(newStart);
      
      console.log(`Updating booking ${eventId} to ${newBookingDate} ${newBookingTime}`);
      
      // @ts-ignore - Supabase types issue
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: newBookingDate,
          booking_time: newBookingTime
        })
        .eq('id', eventId);
      
      if (error) throw error;
      
      // Update local state
      const updatedEvents = calendarEvents.map(event => 
        event.id === eventId 
          ? { ...event, start: newStart, end: newEnd }
          : event
      );
      
      setCalendarEvents(updatedEvents);
      filterEventsByBarber(updatedEvents, selectedBarberId);
      
      // Also update the bookings array
      setBookings(prev => 
        prev.map(booking => 
          booking.id === eventId 
            ? { 
                ...booking, 
                booking_date: newBookingDate,
                booking_time: newBookingTime
              }
            : booking
        )
      );
      
      toast.success('Booking time updated successfully');
    } catch (err: any) {
      console.error('Error updating booking time:', err);
      setError(err.message);
      toast.error('Failed to update booking time');
    } finally {
      setIsLoading(false);
    }
  };

  // Update booking details
  const updateBooking = async (
    bookingId: string, 
    updates: { 
      title?: string; 
      barber_id?: string; 
      service_id?: string; 
      notes?: string;
      booking_date?: string;
      booking_time?: string;
    }
  ) => {
    try {
      setIsLoading(true);
      
      console.log(`Updating booking ${bookingId} with:`, updates);
      
      // @ts-ignore - Supabase types issue
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);
      
      if (error) throw error;
      
      // Refresh bookings to get updated data with joins
      await fetchBookings();
      
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

  // Handle event drop (from drag and drop)
  const handleEventDrop = (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    updateBookingTime(event.id, newStart, newEnd);
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    // Function to handle booking updates
    const handleBookingChange = (payload: any) => {
      console.log('Realtime booking change detected:', payload);
      // Refresh the whole list for simplicity
      fetchBookings();
    };

    // Set up the subscription
    const channel = supabase
      .channel('booking-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        handleBookingChange
      )
      .subscribe();

    console.log('Subscribed to booking changes');

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBookings]);

  return {
    bookings,
    calendarEvents: filteredEvents.length > 0 ? filteredEvents : calendarEvents,
    isLoading,
    error,
    fetchBookings,
    handleEventDrop,
    handleEventClick,
    updateBooking,
    selectedEvent,
    setSelectedEvent,
    isDialogOpen,
    setIsDialogOpen,
    selectedBarberId,
    setBarberFilter,
    clearBarberFilter
  };
};
