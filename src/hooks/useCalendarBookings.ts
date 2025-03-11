import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Booking, LunchBreak } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';
import { bookingToCalendarEvent, formatNewBookingDate, formatNewBookingTime } from '@/utils/calendarUtils';
import { createLunchBreakEvent } from '@/utils/calendarUtils';

export const useCalendarBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [lunchBreaks, setLunchBreaks] = useState<LunchBreak[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const filteredEvents = selectedBarberId 
    ? calendarEvents.filter(event => event.barberId === selectedBarberId)
    : calendarEvents;

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(name),
          service:service_id(name, price, duration)
        `)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });
      
      if (bookingsError) throw bookingsError;
      
      console.log(`Fetched ${bookingsData?.length || 0} bookings`);
      setBookings(bookingsData || []);
      
      const { data: lunchData, error: lunchError } = await supabase
        .from('barber_lunch_breaks')
        .select(`
          *,
          barber:barber_id(name)
        `)
        .eq('is_active', true);
        
      if (lunchError) throw lunchError;
      
      setLunchBreaks(lunchData || []);
      
      const bookingEvents = (bookingsData || []).map(booking => {
        try {
          return bookingToCalendarEvent(booking);
        } catch (err) {
          console.error('Error converting booking to event:', err, booking);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      const lunchEvents = (lunchData || []).map(lunchBreak => {
        try {
          return createLunchBreakEvent(lunchBreak);
        } catch (err) {
          console.error('Error converting lunch break to event:', err, lunchBreak);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      setCalendarEvents([...bookingEvents, ...lunchEvents]);
    } catch (err: any) {
      console.error('Error fetching calendar data:', err);
      setError(err.message);
      toast.error('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    
    const intervalId = setInterval(() => {
      fetchData();
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchData, lastUpdate]);

  const updateBookingTime = async (eventId: string, newStart: Date, newEnd: Date) => {
    try {
      setIsLoading(true);
      
      if (eventId.startsWith('lunch-')) {
        toast.error('Lunch breaks cannot be moved via drag and drop. Please edit them in the barber settings.');
        return;
      }
      
      const newBookingDate = formatNewBookingDate(newStart);
      const newBookingTime = formatNewBookingTime(newStart);
      
      console.log(`Updating booking ${eventId} to ${newBookingDate} ${newBookingTime}`);
      
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: newBookingDate,
          booking_time: newBookingTime
        })
        .eq('id', eventId);
      
      if (error) throw error;
      
      setCalendarEvents(prev => 
        prev.map(event => 
          event.id === eventId 
            ? { ...event, start: newStart, end: newEnd }
            : event
        )
      );
      
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

  const deleteHoliday = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)
        .eq('status', 'holiday');

      if (error) throw error;

      setBookings(prev => prev.filter(booking => booking.id !== bookingId));
      setCalendarEvents(prev => prev.filter(event => event.id !== bookingId));
      
      return true;
    } catch (err: any) {
      console.error('Error deleting holiday:', err);
      throw err;
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
    }
  ) => {
    try {
      setIsLoading(true);
      
      console.log(`Updating booking ${bookingId} with:`, updates);
      
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);
      
      if (error) throw error;
      
      setLastUpdate(Date.now());
      
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
    updateBookingTime(event.id, newStart, newEnd);
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.id.toString().startsWith('lunch-')) {
      toast.info(`${event.barber}'s lunch break: ${event.title}`);
      return;
    }
    
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const handleBookingChange = (payload: any) => {
      console.log('Realtime booking change detected:', payload);
      console.log('Change type:', payload.eventType);
      fetchData();
    };

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
        handleBookingChange
      )
      .subscribe();

    console.log('Subscribed to calendar data changes');

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(lunchChannel);
    };
  }, [fetchData]);

  return {
    bookings,
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
    deleteHoliday
  };
};
