
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Booking } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';
import { bookingToCalendarEvent, formatNewBookingDate, formatNewBookingTime } from '@/utils/calendarUtils';

export const useCalendarBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.message);
      toast.error('Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      setCalendarEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? { ...event, start: newStart, end: newEnd }
            : event
        )
      );
      
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
    calendarEvents,
    isLoading,
    error,
    fetchBookings,
    handleEventDrop,
    handleEventClick,
    selectedEvent,
    setSelectedEvent,
    isDialogOpen,
    setIsDialogOpen
  };
};
