
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

      if (!bookingId || !verificationCode) {
        setError('Missing booking information');
        return false;
      }

      // Format the verification code
      const formattedCode = verificationCode.trim();
      
      // Validate with Supabase
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(*),
          service:service_id(*)
        `)
        .eq('id', bookingId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        setError('Booking not found');
        return false;
      }

      // Check if the code is in the notes field
      const notesLower = (data.notes || '').toLowerCase();
      const codePattern = new RegExp(`verification code: ${formattedCode.toLowerCase()}`);
      const isCodeValid = codePattern.test(notesLower);
      
      // Make sure the phone number is also in the notes
      const formattedPhone = phone.replace(/\s+/g, ''); // Remove spaces
      const phonePattern = new RegExp(`\\(${formattedPhone}\\)`);
      const isPhoneValid = phonePattern.test(notesLower);

      if (!isCodeValid || !isPhoneValid) {
        setError('Invalid verification code or phone number');
        return false;
      }

      setBooking(data);
      setIsVerified(true);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error verifying booking');
      toast.error('Error verifying booking');
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
          .neq('id', bookingId)  // Exclude the current booking
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
  }, [newBookingDate, booking, bookingId]);

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
