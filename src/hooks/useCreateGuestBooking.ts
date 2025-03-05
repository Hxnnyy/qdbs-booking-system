
import { useState } from 'react';
import { toast } from 'sonner';
import { GuestBookingData, GuestBookingResult } from '@/types/guestBooking';
import { createGuestBookingInDb, sendBookingSms } from '@/utils/guestBookingUtils';

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
      
      // Send SMS notification
      const twilioResult = await sendBookingSms(
        bookingData.guest_phone,
        bookingData.guest_name,
        bookingCode,
        data.id,
        bookingData.booking_date,
        bookingData.booking_time
      );

      if (!twilioResult.success) {
        console.error('SMS notification error:', twilioResult.message);
        // Continue despite SMS error, just log it
      }

      setBookingCode(bookingCode);
      toast.success('Booking created successfully!');
      
      return {
        bookingData: data,
        bookingCode,
        twilioResult
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
