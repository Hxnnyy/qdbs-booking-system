import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { useCalendarBookings } from './useCalendarBookings';
import { isTimeSlotBooked, isWithinOpeningHours } from '@/utils/bookingUtils';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';

export const useManageGuestBooking = (bookingId: string, verificationCode: string) => {
  const [booking, setBooking] = useState<any>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBookingDate, setNewBookingDate] = useState<Date | undefined>(undefined);
  const [newBookingTime, setNewBookingTime] = useState<string | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);

  const { allEvents } = useCalendarBookings();

  const verifyBooking = async (phone: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!verificationCode) {
        console.error('Missing verification code');
        setError('Verification code is required');
        return false;
      }

      console.log('Verifying booking with:', { phone, code: verificationCode });
      
      const formattedCode = verificationCode.trim();
      
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(*),
          service:service_id(*)
        `)
        .eq('status', 'confirmed')
        .ilike('notes', `%Verification code: ${formattedCode}%`);

      if (fetchError) {
        console.error('Error fetching booking:', fetchError);
        setError(`Error fetching booking: ${fetchError.message}`);
        return false;
      }

      if (!data || data.length === 0) {
        console.error('No booking found with this verification code');
        setError('No booking found with this verification code');
        return false;
      }

      console.log('All bookings found with this code:', data);
      
      const phoneDigitsOnly = phone.replace(/\D/g, '');
      console.log('Looking for phone number:', phoneDigitsOnly);
      
      const matchingBooking = data.find(booking => {
        const notes = (booking.notes || '').toLowerCase();
        return notes.includes(phoneDigitsOnly);
      });
      
      if (!matchingBooking) {
        console.error('No booking found with this phone number and verification code');
        setError('No booking found with this phone number and verification code');
        return false;
      }

      console.log('Verification successful! Found booking:', matchingBooking);
      setBooking(matchingBooking);
      setIsVerified(true);
      return true;
    } catch (err: any) {
      console.error('Error verifying booking:', err);
      setError(err.message || 'Error verifying booking');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchExistingBookings = async () => {
      if (!newBookingDate || !booking?.barber_id) return;
      
      try {
        setIsLoading(true);
        
        const formattedDate = format(newBookingDate, 'yyyy-MM-dd');
        
        const { data, error } = await supabase
          .from('bookings')
          .select('*, service:service_id(duration)')
          .eq('barber_id', booking.barber_id)
          .eq('booking_date', formattedDate)
          .neq('id', booking.id)
          .eq('status', 'confirmed');

        if (error) throw error;
        
        setExistingBookings(data || []);
      } catch (err) {
        console.error('Error fetching existing bookings:', err);
        toast.error('Failed to load existing bookings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExistingBookings();
  }, [newBookingDate, booking]);

  useEffect(() => {
    const calculateTimeSlots = async () => {
      if (!newBookingDate || !booking || !booking.barber_id || !booking.service) {
        setAvailableTimeSlots([]);
        return;
      }

      try {
        setIsLoading(true);
        setAvailableTimeSlots([]);
        
        const isHoliday = isBarberHolidayDate(allEvents, newBookingDate, booking.barber_id);
        
        if (isHoliday) {
          toast.error('Barber is on holiday on this date');
          setAvailableTimeSlots([]);
          return;
        }
        
        const dayOfWeek = newBookingDate.getDay();
        
        const { data: openingHours, error: openingHoursError } = await supabase
          .from('opening_hours')
          .select('*')
          .eq('barber_id', booking.barber_id)
          .eq('day_of_week', dayOfWeek)
          .maybeSingle();
        
        if (openingHoursError) throw openingHoursError;
        
        if (!openingHours || openingHours.is_closed) {
          toast.error('Barber is not working on this day');
          setAvailableTimeSlots([]);
          return;
        }
        
        const { data: lunchBreaks, error: lunchBreakError } = await supabase
          .from('barber_lunch_breaks')
          .select('*')
          .eq('barber_id', booking.barber_id)
          .eq('is_active', true);
        
        if (lunchBreakError) throw lunchBreakError;
        
        const slots = [];
        let currentTime = openingHours.open_time;
        const closeTime = openingHours.close_time;
        
        let [hours, minutes] = currentTime.split(':').map(Number);
        const [closeHours, closeMinutes] = closeTime.split(':').map(Number);
        
        const closeTimeInMinutes = closeHours * 60 + closeMinutes;
        
        const isLunchBreak = (time: string) => {
          if (!lunchBreaks || lunchBreaks.length === 0) return false;
          
          const [h, m] = time.split(':').map(Number);
          const timeInMinutes = h * 60 + m;
          const serviceDuration = booking.service.duration || 30;
          
          return lunchBreaks.some(breakTime => {
            const [breakHours, breakMinutes] = breakTime.start_time.split(':').map(Number);
            const breakStartMinutes = breakHours * 60 + breakMinutes;
            const breakEndMinutes = breakStartMinutes + breakTime.duration;
            
            return (timeInMinutes >= breakStartMinutes && timeInMinutes < breakEndMinutes) || 
                   (timeInMinutes < breakStartMinutes && (timeInMinutes + serviceDuration) > breakStartMinutes);
          });
        };
        
        while (true) {
          const timeInMinutes = hours * 60 + minutes;
          if (timeInMinutes >= closeTimeInMinutes) {
            break;
          }
          
          const formattedHours = hours.toString().padStart(2, '0');
          const formattedMinutes = minutes.toString().padStart(2, '0');
          const timeSlot = `${formattedHours}:${formattedMinutes}`;
          
          const isBooked = isTimeSlotBooked(timeSlot, booking.service, existingBookings);
          const withinHours = await isWithinOpeningHours(
            booking.barber_id,
            newBookingDate,
            timeSlot,
            booking.service.duration
          );
          const isOnLunchBreak = isLunchBreak(timeSlot);
          
          if (!isBooked && withinHours && !isOnLunchBreak) {
            slots.push(timeSlot);
          }
          
          minutes += 30;
          if (minutes >= 60) {
            hours += 1;
            minutes -= 60;
          }
        }
        
        setAvailableTimeSlots(slots);
      } catch (err) {
        console.error('Error calculating time slots:', err);
        toast.error('Failed to load available time slots');
      } finally {
        setIsLoading(false);
      }
    };

    calculateTimeSlots();
  }, [newBookingDate, booking, existingBookings, allEvents]);

  const modifyBooking = async () => {
    if (!booking || !newBookingDate || !newBookingTime) return;
    
    try {
      setIsModifying(true);
      
      if (!availableTimeSlots.includes(newBookingTime)) {
        toast.error('This time slot is no longer available');
        return;
      }
      
      const formattedDate = format(newBookingDate, 'yyyy-MM-dd');
      
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: formattedDate,
          booking_time: newBookingTime
        })
        .eq('id', booking.id);
        
      if (error) throw error;
      
      setBooking({
        ...booking,
        booking_date: formattedDate,
        booking_time: newBookingTime
      });
      
      setNewBookingDate(undefined);
      setNewBookingTime(null);
      setIsDialogOpen(false);
      
      toast.success('Booking updated successfully');
    } catch (err: any) {
      toast.error('Failed to update booking');
      console.error('Error modifying booking:', err);
    } finally {
      setIsModifying(false);
    }
  };

  const cancelBooking = async () => {
    if (!booking) return;
    
    try {
      setIsCancelling(true);
      
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled'
        })
        .eq('id', booking.id);
        
      if (error) throw error;
      
      setBooking({
        ...booking,
        status: 'cancelled'
      });
      
      toast.success('Booking cancelled successfully');
    } catch (err: any) {
      toast.error('Failed to cancel booking');
      console.error('Error cancelling booking:', err);
    } finally {
      setIsCancelling(false);
    }
  };

  const formattedBookingDateTime = booking ? {
    date: format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy'),
    time: booking.booking_time
  } : null;

  return {
    booking,
    formattedBookingDateTime,
    isLoading,
    error,
    isVerified,
    newBookingDate,
    setNewBookingDate,
    newBookingTime,
    setNewBookingTime,
    availableTimeSlots,
    isDialogOpen,
    setIsDialogOpen,
    isModifying,
    isCancelling,
    modifyBooking,
    cancelBooking,
    allCalendarEvents: allEvents,
    verifyBooking,
    existingBookings,
  };
};
