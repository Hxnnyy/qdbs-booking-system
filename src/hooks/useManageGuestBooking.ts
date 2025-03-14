
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { useCalendarBookings } from './useCalendarBookings';

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

  // Load available time slots when a new date is selected
  useEffect(() => {
    const loadTimeSlots = async () => {
      if (!newBookingDate || !booking) return;

      try {
        setIsLoading(true);
        
        const formattedDate = format(newBookingDate, 'yyyy-MM-dd');
        
        // Get all bookings for this barber on the selected date
        const { data: existingBookings, error } = await supabase
          .from('bookings')
          .select('booking_time')
          .eq('barber_id', booking.barber_id)
          .eq('booking_date', formattedDate)
          .neq('id', booking.id)  // Exclude the current booking
          .neq('status', 'cancelled');

        if (error) throw error;
        
        // Define available time slots
        const allTimeSlots = [
          '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
          '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
          '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
        ];
        
        // Filter out booked slots
        const bookedTimes = existingBookings?.map(b => b.booking_time) || [];
        const available = allTimeSlots.filter(time => !bookedTimes.includes(time));
        
        setAvailableTimeSlots(available);
      } catch (err: any) {
        toast.error('Error loading available time slots');
      } finally {
        setIsLoading(false);
      }
    };

    loadTimeSlots();
  }, [newBookingDate, booking]);

  // Function to modify booking date/time
  const modifyBooking = async () => {
    if (!booking || !newBookingDate || !newBookingTime) return;
    
    try {
      setIsModifying(true);
      
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
