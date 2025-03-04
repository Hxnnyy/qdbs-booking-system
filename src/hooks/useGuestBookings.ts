
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Booking, InsertableBooking } from '@/supabase-types';
import { v4 as uuidv4 } from 'uuid';

export interface GuestBookingData {
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  guest_name: string;
  guest_phone: string;
  notes?: string;
}

export const useGuestBookings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingCode, setBookingCode] = useState<string | null>(null);

  const createGuestBooking = async (bookingData: GuestBookingData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate a random code for the guest booking
      const bookingCode = Math.floor(100000 + Math.random() * 900000).toString();
      // Generate a random UUID for the guest user
      const guestUserId = uuidv4();

      const { guest_name, guest_phone, ...bookingDetails } = bookingData;

      // 1. Create a temporary profile for the guest without requiring auth
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: guestUserId,
          first_name: guest_name,
          phone: guest_phone,
          is_admin: false
        });

      if (profileError) {
        throw new Error(profileError.message || 'Failed to create guest profile');
      }

      // 2. Create the booking
      const newBooking: Omit<InsertableBooking, 'status'> = {
        ...bookingDetails,
        user_id: guestUserId,
        notes: bookingData.notes || `Guest booking by ${guest_name}. Verification code: ${bookingCode}`
      };

      // @ts-ignore - Supabase types issue
      const { data, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          ...newBooking,
          status: 'confirmed'
        })
        .select();

      if (bookingError) {
        throw new Error(bookingError.message || 'Failed to create booking');
      }

      // 3. Send SMS notification
      const { error: smsError } = await supabase.functions.invoke('send-booking-sms', {
        body: {
          phone: guest_phone,
          name: guest_name,
          bookingCode: bookingCode,
          bookingId: data[0].id,
          bookingDate: bookingData.booking_date,
          bookingTime: bookingData.booking_time
        }
      });

      if (smsError) {
        console.error('SMS notification error:', smsError);
        // Continue despite SMS error, just log it
      }

      setBookingCode(bookingCode);
      toast.success('Booking created successfully!');
      
      return {
        bookingData: data[0],
        bookingCode
      };
    } catch (err: any) {
      console.error('Error in createGuestBooking:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to create booking');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getGuestBookingByCode = async (phone: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Find the profile with the phone number
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone);

      if (profileError) {
        throw new Error(profileError.message || 'Failed to find profile');
      }

      if (!profiles || profiles.length === 0) {
        throw new Error('No booking found with this phone number');
      }

      // Find bookings for the profile that contain the code in the notes
      const userIds = profiles.map(profile => profile.id);
      
      // @ts-ignore - Supabase types issue
      const { data: bookings, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(name),
          service:service_id(name, price, duration)
        `)
        .in('user_id', userIds)
        .ilike('notes', `%Verification code: ${code}%`)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (bookingError) {
        throw new Error(bookingError.message || 'Failed to fetch booking');
      }

      if (!bookings || bookings.length === 0) {
        throw new Error('No booking found with this verification code');
      }

      return bookings;
    } catch (err: any) {
      console.error('Error in getGuestBookingByCode:', err);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelGuestBooking = async (bookingId: string, phone: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Verify the booking code first
      const bookings = await getGuestBookingByCode(phone, code);
      
      if (!bookings.some(booking => booking.id === bookingId)) {
        throw new Error('You are not authorized to cancel this booking');
      }

      // Cancel the booking
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (error) {
        throw new Error(error.message || 'Failed to cancel booking');
      }

      toast.success('Booking cancelled successfully');
      return true;
    } catch (err: any) {
      console.error('Error in cancelGuestBooking:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to cancel booking');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createGuestBooking,
    getGuestBookingByCode,
    cancelGuestBooking,
    bookingCode,
    isLoading,
    error
  };
};
