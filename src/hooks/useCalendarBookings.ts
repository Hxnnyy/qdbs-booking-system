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
  }, [fetchData]);

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

  const handleEventDrop = (event: CalendarEvent, newStart: Date, newEnd: Date) => {
    updateBookingTime(event.id, newStart, newEnd);
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.id.startsWith('lunch-')) {
      toast.info(`${event.barber}'s lunch break: ${event.title}`);
      return;
    }
    
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const handleBookingChange = (payload: any) => {
      console.log('Realtime booking change detected:', payload);
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

  const createHolidayBooking = async (barberId: string, startDate: Date, endDate: Date) => {
    try {
      setIsLoading(true);
      
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('id')
        .limit(1);
      
      if (serviceError) throw serviceError;
      
      if (!serviceData || serviceData.length === 0) {
        throw new Error('No services found in the database');
      }
      
      const serviceId = serviceData[0].id;
      
      const formattedStartDate = formatNewBookingDate(startDate);
      const startTime = '09:00';
      
      const newHoliday = {
        barber_id: barberId,
        service_id: serviceId,
        user_id: '00000000-0000-0000-0000-000000000000',
        booking_date: formattedStartDate,
        booking_time: startTime,
        status: 'holiday',
        notes: `Holiday from ${formatNewBookingDate(startDate)} to ${formatNewBookingDate(endDate)}`,
        guest_booking: true
      };
      
      console.log('Creating holiday booking:', newHoliday);
      
      const { error: insertError } = await supabase
        .from('bookings')
        .insert([newHoliday]);
      
      if (insertError) throw insertError;
      
      toast.success('Holiday scheduled successfully');
      fetchData();
      
      return true;
    } catch (err: any) {
      console.error('Error creating holiday:', err);
      setError(err.message);
      toast.error(`Failed to schedule holiday: ${err.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    bookings,
    calendarEvents: filteredEvents,
    isLoading,
    error,
    fetchBookings: fetchData,
    handleEventDrop,
    handleEventClick,
    updateBooking,
    createHolidayBooking,
    selectedEvent,
    setSelectedEvent,
    isDialogOpen,
    setIsDialogOpen,
    selectedBarberId,
    setSelectedBarberId,
    allEvents: calendarEvents
  };
};
