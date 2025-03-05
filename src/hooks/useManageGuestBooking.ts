
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  fetchGuestBookingsByCode, 
  cancelGuestBookingInDb, 
  updateGuestBookingInDb,
  sendBookingSms
} from '@/utils/guestBookingUtils';

export const useManageGuestBooking = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getGuestBookingByCode = async (phone: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const bookings = await fetchGuestBookingsByCode(phone, code);
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
      await cancelGuestBookingInDb(bookingId);
      
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

  const updateGuestBooking = async (
    bookingId: string, 
    phone: string, 
    code: string, 
    newDate: string, 
    newTime: string
  ) => {
    try {
      setIsLoading(true);
      setError(null);

      // Verify the booking code first
      const bookings = await getGuestBookingByCode(phone, code);
      
      const bookingToUpdate = bookings.find(booking => booking.id === bookingId);
      
      if (!bookingToUpdate) {
        throw new Error('You are not authorized to update this booking');
      }

      // Update the booking date and time
      await updateGuestBookingInDb(bookingId, newDate, newTime);

      // Send SMS notification about the update
      const smsResult = await sendBookingSms(
        phone,
        "Guest", // We don't have the name from this context
        code,
        bookingId,
        newDate,
        newTime,
        true // isUpdate = true
      );

      if (!smsResult.success) {
        console.error('SMS notification error:', smsResult.message);
        // Continue despite SMS error, just log it
      }

      toast.success('Booking updated successfully');
      return true;
    } catch (err: any) {
      console.error('Error in updateGuestBooking:', err);
      setError(err.message);
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
    isLoading,
    error
  };
};
