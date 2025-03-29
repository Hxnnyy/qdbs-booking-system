
import { useState, useEffect, useCallback, useMemo } from 'react';
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
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log(`Processing booking ${eventType}:`, payload);
    
    if (eventType === 'INSERT') {
      // Fetch the complete booking with relations
      supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(id, name, color),
          service:service_id(name, price, duration)
        `)
        .eq('id', newRecord.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching new booking:', error);
            return;
          }
          
          try {
            const event = bookingToCalendarEvent(data as Booking);
            if (event) {
              setCalendarEvents(prev => [...prev, event]);
              
              // Update bookings array as well for consistency
              setBookings(prev => [...prev, data as Booking]);
            }
          } catch (err) {
            console.error('Error converting new booking to event:', err);
          }
        });
    } 
    else if (eventType === 'UPDATE') {
      // If status changed to cancelled, remove it from the calendar
      if (newRecord.status === 'cancelled' && oldRecord.status !== 'cancelled') {
        setCalendarEvents(prev => 
          prev.filter(event => event.id !== oldRecord.id)
        );
        return;
      }
      
      // For other updates, fetch the complete booking with relations
      supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(id, name, color),
          service:service_id(name, price, duration)
        `)
        .eq('id', oldRecord.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching updated booking:', error);
            return;
          }
          
          try {
            const updatedEvent = bookingToCalendarEvent(data as Booking);
            if (updatedEvent) {
              setCalendarEvents(prev => 
                prev.map(event => event.id === oldRecord.id ? updatedEvent : event)
              );
              
              // Update bookings array as well for consistency
              setBookings(prev => 
                prev.map(booking => booking.id === oldRecord.id ? (data as Booking) : booking)
              );
            }
          } catch (err) {
            console.error('Error converting updated booking to event:', err);
          }
        });
    } 
    else if (eventType === 'DELETE') {
      // Remove the event from state
      setCalendarEvents(prev => 
        prev.filter(event => event.id !== oldRecord.id)
      );
      
      // Remove from bookings array as well
      setBookings(prev => 
        prev.filter(booking => booking.id !== oldRecord.id)
      );
    }
  }, []);

  // Handler for processing lunch break changes
  const handleLunchBreakChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log(`Processing lunch break ${eventType}:`, payload);
    
    if (eventType === 'INSERT' || (eventType === 'UPDATE' && newRecord.is_active)) {
      // Fetch the complete lunch break with barber relation
      supabase
        .from('barber_lunch_breaks')
        .select(`*, barber:barber_id(id, name, color)`)
        .eq('id', newRecord.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching lunch break:', error);
            return;
          }
          
          try {
            const event = createLunchBreakEvent(data);
            if (event) {
              // For updates, first remove the old event if it exists
              if (eventType === 'UPDATE') {
                setCalendarEvents(prev => 
                  prev.filter(e => !e.id.startsWith('lunch-') || e.id !== `lunch-${oldRecord.id}`)
                );
              }
              
              // Then add the new/updated event
              setCalendarEvents(prev => [...prev, event]);
              
              // Update lunchBreaks array as well
              if (eventType === 'UPDATE') {
                setLunchBreaks(prev => 
                  prev.map(lb => lb.id === newRecord.id ? data : lb)
                );
              } else {
                setLunchBreaks(prev => [...prev, data]);
              }
            }
          } catch (err) {
            console.error('Error converting lunch break to event:', err);
          }
        });
    } 
    else if (eventType === 'UPDATE' && !newRecord.is_active) {
      // If the lunch break was deactivated, remove it
      setCalendarEvents(prev => 
        prev.filter(event => !event.id.startsWith('lunch-') || event.id !== `lunch-${oldRecord.id}`)
      );
      
      // Update lunchBreaks array
      setLunchBreaks(prev => 
        prev.filter(lb => lb.id !== oldRecord.id)
      );
    } 
    else if (eventType === 'DELETE') {
      // Remove the lunch break event
      setCalendarEvents(prev => 
        prev.filter(event => !event.id.startsWith('lunch-') || event.id !== `lunch-${oldRecord.id}`)
      );
      
      // Remove from lunchBreaks array
      setLunchBreaks(prev => 
        prev.filter(lb => lb.id !== oldRecord.id)
      );
    }
  }, []);

  // Handler for processing holiday changes
  const handleHolidayChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log(`Processing holiday ${eventType}:`, payload);
    
    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      // Fetch the complete holiday with barber relation
      supabase
        .from('barber_holidays')
        .select(`*, barber:barber_id(id, name, color)`)
        .eq('id', newRecord.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error fetching holiday:', error);
            return;
          }
          
          try {
            const event = createHolidayEvent(data, data.barber);
            if (event) {
              // For updates, first remove the old event if it exists
              if (eventType === 'UPDATE') {
                setCalendarEvents(prev => 
                  prev.filter(e => e.status !== 'holiday' || e.id !== oldRecord.id)
                );
              }
              
              // Then add the new/updated event
              setCalendarEvents(prev => [...prev, event]);
              
              // Update holidays array as well
              if (eventType === 'UPDATE') {
                setHolidays(prev => 
                  prev.map(h => h.id === newRecord.id ? data : h)
                );
              } else {
                setHolidays(prev => [...prev, data]);
              }
            }
          } catch (err) {
            console.error('Error converting holiday to event:', err);
          }
        });
    } 
    else if (eventType === 'DELETE') {
      // Remove the holiday event
      setCalendarEvents(prev => 
        prev.filter(event => event.status !== 'holiday' || event.id !== oldRecord.id)
      );
      
      // Remove from holidays array
      setHolidays(prev => 
        prev.filter(h => h.id !== oldRecord.id)
      );
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add this effect to handle date changes
  useEffect(() => {
    // When the date changes, refresh the calendar data
    console.log('Current view date changed:', currentViewDate);
  }, [currentViewDate]);

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
  ) => {
    try {
      setIsLoading(true);
      
      console.log(`Updating booking ${bookingId} with:`, updates);
      
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);
      
      if (error) throw error;
      
      // We don't need to fetch all data here - the realtime subscription will handle the update
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

  useEffect(() => {
    // Set up more efficient realtime subscriptions
    const bookingsChannel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          handleBookingChange({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
        }
      )
      .subscribe();
      
    const lunchChannel = supabase
      .channel('lunch-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barber_lunch_breaks' },
        (payload) => {
          handleLunchBreakChange({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
        }
      )
      .subscribe();
      
    const holidaysChannel = supabase
      .channel('holidays-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'barber_holidays' },
        (payload) => {
          handleHolidayChange({
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old
          });
        }
      )
      .subscribe();

    console.log('Subscribed to calendar data changes with optimized handlers');

    return () => {
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(lunchChannel);
      supabase.removeChannel(holidaysChannel);
    };
  }, [handleBookingChange, handleLunchBreakChange, handleHolidayChange]);

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
    setCurrentViewDate
  };
};
