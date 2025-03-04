
import { useState } from 'react';
import { toast } from 'sonner';
import { useGuestBookings } from '@/hooks/useGuestBookings';

export const useVerifyGuestBooking = () => {
  const { getGuestBookingByCode, cancelGuestBooking, isLoading } = useGuestBookings();
  
  const [phone, setPhone] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [bookings, setBookings] = useState<any[]>([]);
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    
    if (!code.trim()) {
      toast.error('Please enter your booking code');
      return;
    }
    
    try {
      const foundBookings = await getGuestBookingByCode(phone, code);
      setBookings(foundBookings);
      setIsVerified(true);
      toast.success('Booking found!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to find booking');
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setIsCancelling(true);
    
    try {
      const success = await cancelGuestBooking(bookingId, phone, code);
      
      if (success) {
        // Update the status in the local state
        setBookings(prevBookings => 
          prevBookings.map(booking => 
            booking.id === bookingId 
              ? { ...booking, status: 'cancelled' } 
              : booking
          )
        );
      }
    } catch (error) {
      // Error is handled in the hook
    } finally {
      setIsCancelling(false);
    }
  };

  const resetVerification = () => {
    setIsVerified(false);
    setBookings([]);
  };

  return {
    phone,
    setPhone,
    code,
    setCode,
    bookings,
    isVerified,
    isLoading,
    isCancelling,
    handleVerify,
    handleCancelBooking,
    resetVerification
  };
};
