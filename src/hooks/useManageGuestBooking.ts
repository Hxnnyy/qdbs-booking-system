
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

  // Get calendar events for holiday checking
  const { allEvents } = useCalendarBookings(); 

  // Function to verify the booking with phone number and code
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
      
      // Format the verification code
      const formattedCode = verificationCode.trim();
      
      // Query all bookings with the verification code in the notes field
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
      
      // Filter the bookings by phone number
      const phoneDigitsOnly = phone.replace(/\D/g, '');
      console.log('Looking for phone number:', phoneDigitsOnly);
      
      // Find the booking that contains the phone number in the notes
      const matchingBooking = data.find(booking => {
        const notes = (booking.notes || '').toLowerCase();
        return notes.includes(phoneDigitsOnly);
      });
      
      if (!matchingBooking) {
        console.error('No booking found with this phone number and verification code');
        setError('No booking found with this phone number and verification code');
        return false;
      }

      // Success - set booking data and verified state
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

  // Fetch existing bookings when date or barber changes
  useEffect(() => {
    const fetchExistingBookings = async () => {
      if (!newBookingDate || !booking?.barber_id) return;
      
      try {
        setIsLoading(true);
        
        const formattedDate = format(newBookingDate, 'yyyy-MM-dd');
        
        // Get all bookings for this barber on the selected date
        const { data, error } = await supabase
          .from('bookings')
          .select('*, service:service_id(duration)')
          .eq('barber_id', booking.barber_id)
          .eq('booking_date', formattedDate)
          .neq('id', booking.id)  // Exclude the current booking
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

  // Calculate available time slots
  useEffect(() => {
    const calculateTimeSlots = async () => {
      if (!newBookingDate || !booking || !booking.barber_id || !booking.service) {
        setAvailableTimeSlots([]);
        return;
      }

      try {
        setIsLoading(true);
        setAvailableTimeSlots([]);
        
        // Check if barber is on holiday
        const isHoliday = isBarberHolidayDate(allEvents, newBookingDate, booking.barber_id);
        
        if (isHoliday) {
          toast.error('Barber is on holiday on this date');
          setAvailableTimeSlots([]);
          return;
        }
        
        // Fetch barber opening hours for this day
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
        
        // Get lunch breaks
        const { data: lunchBreaks, error: lunchBreakError } = await supabase
          .from('barber_lunch_breaks')
          .select('*')
          .eq('barber_id', booking.barber_id)
          .eq('is_active', true);
        
        if (lunchBreakError) throw lunchBreakError;
        
        // Create time slots based on opening hours
        const slots = [];
        let currentTime = openingHours.open_time;
        const closeTime = openingHours.close_time;
        
        let [hours, minutes] = currentTime.split(':').map(Number);
        const [closeHours, closeMinutes] = closeTime.split(':').map(Number);
        
        const closeTimeInMinutes = closeHours * 60 + closeMinutes;
        
        // Function to check if a time slot overlaps with any lunch break
        const isLunchBreak = (time: string) => {
          if (!lunchBreaks || lunchBreaks.length === 0) return false;
          
          const [h, m] = time.split(':').map(Number);
          const timeInMinutes = h * 60 + m;
          const serviceDuration = booking.service.duration || 30;
          
          return lunchBreaks.some(breakTime => {
            const [breakHours, breakMinutes] = breakTime.start_time.split(':').map(Number);
            const breakStartMinutes = breakHours * 60 + breakMinutes;
            const breakEndMinutes = breakStartMinutes + breakTime.duration;
            
            // Check if slot starts during lunch break or if service would overlap with lunch break
            return (timeInMinutes >= breakStartMinutes && timeInMinutes < breakEndMinutes) || 
                   (timeInMinutes < breakStartMinutes && (timeInMinutes + serviceDuration) > breakStartMinutes);
          });
        };
        
        // Generate all possible 30-minute slots within opening hours
        while (true) {
          const timeInMinutes = hours * 60 + minutes;
          if (timeInMinutes >= closeTimeInMinutes) {
            break;
          }
          
          const formattedHours = hours.toString().padStart(2, '0');
          const formattedMinutes = minutes.toString().padStart(2, '0');
          const timeSlot = `${formattedHours}:${formattedMinutes}`;
          
          // Check various constraints
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
          
          // Increment by 30 minutes
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

  // Function to modify booking date/time
  const modifyBooking = async () => {
    if (!booking || !newBookingDate || !newBookingTime) return;
    
    try {
      setIsModifying(true);
      
      // Final validation
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
      
      // Update the local booking data
      setBooking({
        ...booking,
        booking_date: formattedDate,
        booking_time: newBookingTime
      });
      
      // Reset state
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

  // Function to cancel booking
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
      
      // Update the local booking data
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

  // Format the booking date/time for display
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
  };
};
