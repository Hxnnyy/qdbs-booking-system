import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { isBarberOnHoliday } from '@/utils/calendarUtils';

interface GuestBooking {
  id: string;
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes?: string;
}

export const useGuestBookings = () => {
  const [isLoading, setIsLoading] = useState(false);

  const verifyBooking = async (bookingId: string, phone: string, code: string): Promise<GuestBooking | null> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .like('notes', `%${phone}%`)
        .like('notes', `%${code}%`)
        .single();

      if (error) {
        console.error('Error verifying booking:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error in verifyBooking:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getGuestBookingByCode = async (phone: string, code: string): Promise<GuestBooking[]> => {
    try {
      setIsLoading(true);

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .like('notes', `%${phone}%`)
        .like('notes', `%${code}%`)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) {
        console.error('Error fetching guest bookings:', error);
        toast.error('Failed to fetch bookings');
        return [];
      }

      return data || [];
    } catch (error: any) {
      console.error('Error in getGuestBookingByCode:', error);
      toast.error(error.message || 'Failed to fetch bookings');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const cancelGuestBooking = async (bookingId: string, phone: string, code: string): Promise<boolean> => {
    try {
      setIsLoading(true);

      // 1. Verify the booking code
      const booking = await verifyBooking(bookingId, phone, code);

      if (!booking) {
        throw new Error('Invalid booking code or booking not found');
      }

      // 2. Cancel the booking
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Booking cancelled successfully');
      return true;
    } catch (err: any) {
      console.error('Error cancelling guest booking:', err);
      toast.error(err.message || 'Failed to cancel booking');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateGuestBooking = async (
    bookingId: string,
    phone: string,
    code: string,
    newBookingDate: string,
    newBookingTime: string
  ) => {
    try {
      setIsLoading(true);
      
      // 1. Verify the booking code
      const booking = await verifyBooking(bookingId, phone, code);
      
      if (!booking) {
        throw new Error('Invalid booking code or booking not found');
      }
      
      // 2. Check if the barber is on holiday for the new date
      const isHoliday = await isBarberOnHoliday(booking.barber_id, new Date(newBookingDate));
      
      if (isHoliday) {
        throw new Error('Cannot reschedule to this date as the barber is on holiday');
      }
      
      // 3. Update the booking
      const { error } = await supabase
        .from('bookings')
        .update({
          booking_date: newBookingDate,
          booking_time: newBookingTime
        })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast.success('Booking updated successfully');
      return true;
    } catch (err: any) {
      console.error('Error updating guest booking:', err);
      toast.error(err.message || 'Failed to update booking');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getGuestBookingByCode,
    cancelGuestBooking,
    updateGuestBooking,
    isLoading
  };
};
