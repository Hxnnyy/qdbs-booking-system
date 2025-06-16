
import { useState } from 'react';
import { toast } from 'sonner';
import { GuestBookingData, GuestBookingResult } from '@/types/guestBooking';
import { createGuestBookingInDb, sendBookingEmail } from '@/utils/guestBookingUtils';
import { supabase } from '@/integrations/supabase/client';

export const useCreateGuestBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingCode, setBookingCode] = useState<string | null>(null);

  const createGuestBooking = async (bookingData: GuestBookingData): Promise<GuestBookingResult> => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate a random code for the guest booking
      const bookingCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create the booking in the database
      const data = await createGuestBookingInDb(bookingData, bookingCode);
      
      // Get barber and service names for the email
      const [barberData, serviceData] = await Promise.all([
        supabase.from('barbers').select('name').eq('id', bookingData.barber_id).single(),
        supabase.from('services').select('name').eq('id', bookingData.service_id).single()
      ]);

      // Send email confirmation
      const emailResult = await sendBookingEmail(
        bookingData.guest_email || '',
        bookingData.guest_name,
        bookingCode,
        data.id,
        bookingData.booking_date,
        bookingData.booking_time,
        barberData.data?.name || 'Your Barber',
        serviceData.data?.name || 'Your Service'
      );

      if (!emailResult.success) {
        console.error('Email notification error:', emailResult.message);
        // Continue despite email error, just log it
      }

      setBookingCode(bookingCode);
      toast.success('Booking created successfully!');
      
      return {
        bookingData: data,
        bookingCode,
        twilioResult: {
          success: true,
          message: 'Booking confirmed via email',
          isTwilioConfigured: false // No SMS for confirmations anymore
        }
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

  return {
    createGuestBooking,
    bookingCode,
    isLoading,
    error
  };
};
