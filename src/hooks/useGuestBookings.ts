import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { isBarberOnHoliday } from '@/utils/bookingUpdateUtils';

interface GuestBooking {
  id: string;
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes?: string;
  guest_email?: string;
}

interface CreateGuestBookingParams {
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  notes?: string;
}

const GUEST_USER_ID = '00000000-0000-0000-0000-000000000000';

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

      const booking = await verifyBooking(bookingId, phone, code);

      if (!booking) {
        throw new Error('Invalid booking code or booking not found');
      }

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
      
      const booking = await verifyBooking(bookingId, phone, code);
      
      if (!booking) {
        throw new Error('Invalid booking code or booking not found');
      }
      
      const isHoliday = await isBarberOnHoliday(booking.barber_id, new Date(newBookingDate));
      
      if (isHoliday) {
        throw new Error('Cannot reschedule to this date as the barber is on holiday');
      }
      
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

  const createGuestBooking = async (params: CreateGuestBookingParams) => {
    try {
      setIsLoading(true);
      
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      const formattedNotes = `Guest booking by ${params.guest_name} (${params.guest_phone}). Verification code: ${verificationCode}${params.notes ? `. Notes: ${params.notes}` : ''}`;
      
      const isHoliday = await isBarberOnHoliday(params.barber_id, new Date(params.booking_date));
      
      if (isHoliday) {
        throw new Error('Cannot book on this date as the barber is on holiday');
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .insert({
          barber_id: params.barber_id,
          service_id: params.service_id,
          booking_date: params.booking_date,
          booking_time: params.booking_time,
          status: 'confirmed',
          notes: formattedNotes,
          guest_booking: true,
          user_id: GUEST_USER_ID,
          guest_email: params.guest_email
        })
        .select()
        .single();
      
      if (error) throw error;
      
      console.log('Guest booking created:', data);
      console.log('Verification code:', verificationCode);
      
      toast.success('Booking created successfully!');
      
      return {
        ...data,
        bookingCode: verificationCode
      };
    } catch (err: any) {
      console.error('Error creating guest booking:', err);
      toast.error(err.message || 'Failed to create booking');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getGuestBookingByCode,
    cancelGuestBooking,
    updateGuestBooking,
    createGuestBooking,
    isLoading
  };
};
