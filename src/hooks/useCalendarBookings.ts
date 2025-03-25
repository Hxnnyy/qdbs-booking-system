import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Booking, LunchBreak } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';
import { bookingToCalendarEvent, createLunchBreakEvent, createHolidayEvent, clearBarberColorCache } from '@/utils/calendarUtils';
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

  const filteredEvents = selectedBarberId 
    ? calendarEvents.filter(event => event.barberId === selectedBarberId)
    : calendarEvents;

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      clearBarberColorCache();
      
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(name, color),
          service:service_id(name, price, duration),
          profile:user_id(first_name, last_name, email)
        `)
        .neq('status', 'cancelled')
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });
      
      if (bookingsError) throw bookingsError;
      
      setBookings(bookingsData || []);
      
      const { data: lunchData, error: lunchError } = await supabase
        .from('barber_lunch_breaks')
        .select(`
          *,
          barber:barber_id(name, color)
        `)
        .eq('is_active', true);
        
      if (lunchError) throw lunchError;
      
      setLunchBreaks(lunchData || []);
      
      const { data: holidaysData, error: holidaysError } = await supabase
        .from('barber_holidays')
        .select(`
          *,
          barber:barber_id(name, color)
        `)
        .order('start_date', { ascending: true });
        
      if (holidaysError) throw holidaysError;
      
      setHolidays(holidaysData || []);
      
      const bookingEvents = (bookingsData || []).map(booking => {
        try {
          return bookingToCalendarEvent(booking);
        } catch (err) {
          console.error('Error converting booking to event:', err, booking);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      const processedLunchBreaks = new Map<string, LunchBreak>();
      (lunchData || []).forEach(lunchBreak => {
        processedLunchBreaks.set(lunchBreak.barber_id, lunchBreak);
      });
      
      const lunchEvents = Array.from(processedLunchBreaks.values()).map(lunchBreak => {
        try {
          return createLunchBreakEvent(lunchBreak);
        } catch (err) {
          console.error('Error converting lunch break to event:', err, lunchBreak);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      console.log(`Generated ${lunchEvents.length} lunch break events from ${lunchData?.length} lunch break records`);
      
      const holidayEvents = (holidaysData || []).map(holiday => {
        try {
          return createHolidayEvent(holiday, holiday.barber);
        } catch (err) {
          console.error('Error converting holiday to event:', err, holiday);
          return null;
        }
      }).filter(Boolean) as CalendarEvent[];
      
      setCalendarEvents([...bookingEvents, ...holidayEvents, ...lunchEvents]);
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
      if (eventId.startsWith('lunch-')) {
        toast.error('Lunch breaks cannot be moved. Please edit them in the barber settings.');
        return;
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
      
      setCalendarEvents(prev => 
        prev.map(e => {
          if (e.id === eventId) {
            const duration = e.end.getTime() - e.start.getTime();
            return {
              ...e,
              start: newStart,
              end: new Date(newStart.getTime() + duration)
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
        await fetchData();
        throw error;
      }
      
      toast.success('Booking time updated successfully');
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

  useEffect(() => {
    const handleChange = (payload: any) => {
      console.log('Realtime change detected:', payload);
      fetchData();
    };

    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        handleChange
      )
      .subscribe();
      
    const lunchChannel = supabase
      .channel('lunch-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barber_lunch_breaks' },
        handleChange
      )
      .subscribe();
      
    const holidaysChannel = supabase
      .channel('holidays-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barber_holidays' },
        handleChange
      )
      .subscribe();

    console.log('Subscribed to calendar data changes');

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
    allEvents: calendarEvents
  };
};
