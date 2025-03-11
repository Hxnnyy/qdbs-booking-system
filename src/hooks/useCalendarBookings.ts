import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Booking, LunchBreak } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';
import { bookingToCalendarEvent, formatNewBookingDate, formatNewBookingTime } from '@/utils/calendarUtils';
import { createLunchBreakEvent, createHolidayEvent, clearBarberColorCache } from '@/utils/calendarUtils';

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

  // Filter events by selected barber
  const filteredEvents = selectedBarberId 
    ? calendarEvents.filter(event => event.barberId === selectedBarberId)
    : calendarEvents;

  // Fetch all bookings, lunch breaks, and holidays
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clear the barber color cache to ensure we fetch fresh colors
      clearBarberColorCache();
      
      // Fetch bookings
      // @ts-ignore - Supabase types issue
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(name, color),
          service:service_id(name, price, duration)
        `)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });
      
      if (bookingsError) throw bookingsError;
      
      setBookings(bookingsData || []);
      
      // Fetch lunch breaks
      // @ts-ignore - Supabase types issue
      const { data: lunchData, error: lunchError } = await supabase
        .from('barber_lunch_breaks')
        .select(`
          *,
          barber:barber_id(name, color)
        `)
        .eq('is_active', true);
        
      if (lunchError) throw lunchError;
      
      setLunchBreaks(lunchData || []);
      
      // Fetch holidays
      // @ts-ignore - Supabase types issue
      const { data: holidaysData, error: holidaysError } = await supabase
        .from('barber_holidays')
        .select(`
          *,
          barber:barber_id(name, color)
        `)
        .order('start_date', { ascending: true });
        
      if (holidaysError) throw holidaysError;
      
      setHolidays(holidaysData || []);
      
      // Convert bookings to calendar events
      const bookingEvents = (bookingsData || []).map(booking => {
        try {
          return bookingToCalendarEvent(booking);
        } catch (err) {
          console.error('Error converting booking to event:', err, booking);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      // Convert lunch breaks to calendar events
      const lunchEvents = (lunchData || []).map(lunchBreak => {
        try {
          return createLunchBreakEvent(lunchBreak);
        } catch (err) {
          console.error('Error converting lunch break to event:', err, lunchBreak);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      // Convert holidays to calendar events
      const holidayEvents = (holidaysData || []).map(holiday => {
        try {
          return createHolidayEvent(holiday, holiday.barber);
        } catch (err) {
          console.error('Error converting holiday to event:', err, holiday);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      // Combine all event types
      setCalendarEvents([...bookingEvents, ...lunchEvents, ...holidayEvents]);
    } catch (err: any) {
      console.error('Error fetching calendar data:', err);
      setError(err.message);
      toast.error('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update booking time/date (for drag and drop)
  const updateBookingTime = async (eventId: string, newStart: Date, newEnd: Date) => {
    try {
      setIsLoading(true);
      
      // Check if this is a lunch break event (starts with 'lunch-')
      if (eventId.startsWith('lunch-')) {
        toast.error('Lunch breaks cannot be moved via drag and drop. Please edit them in the barber settings.');
        return;
      }
      
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
      await fetchData();
      
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
    // Don't allow moving lunch breaks
    if (event.status === 'lunch-break' || event.id.startsWith('lunch-')) {
      toast.error('Lunch breaks cannot be moved via drag and drop. Please edit them in the barber settings.');
      return;
    }
    
    updateBookingTime(event.id, newStart, newEnd);
  };

  // Handle event click
  const handleEventClick = (event: CalendarEvent) => {
    // Just show a toast for lunch breaks instead of opening dialog
    if (event.status === 'lunch-break' || event.id.startsWith('lunch-')) {
      toast.info(`${event.barber}'s lunch break: ${event.title}`);
      return;
    }
    
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  // Subscribe to realtime updates
  useEffect(() => {
    // Function to handle booking changes
    const handleChange = (payload: any) => {
      console.log('Realtime change detected:', payload);
      // Refresh the whole list for simplicity
      fetchData();
    };

    // Set up the subscription for bookings
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        handleChange
      )
      .subscribe();
      
    // Set up the subscription for lunch breaks
    const lunchChannel = supabase
      .channel('lunch-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barber_lunch_breaks' },
        handleChange
      )
      .subscribe();
      
    // Set up the subscription for holidays
    const holidaysChannel = supabase
      .channel('holidays-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barber_holidays' },
        handleChange
      )
      .subscribe();

    console.log('Subscribed to calendar data changes');

    // Cleanup
    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(lunchChannel);
      supabase.removeChannel(holidaysChannel);
    };
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
    allEvents: calendarEvents // Provide access to all events (unfiltered)
  };
};
