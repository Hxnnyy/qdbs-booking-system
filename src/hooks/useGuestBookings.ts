
import { useCreateGuestBooking } from './useCreateGuestBooking';
import { useManageGuestBooking } from './useManageGuestBooking';

export type { GuestBookingData } from '@/types/guestBooking';

export const useGuestBookings = () => {
  const { 
    createGuestBooking, 
    bookingCode, 
    isLoading: isCreating, 
    error: createError 
  } = useCreateGuestBooking();
  
  const { 
    getGuestBookingByCode, 
    cancelGuestBooking, 
    updateGuestBooking, 
    isLoading: isManaging, 
    error: manageError 
  } = useManageGuestBooking();

  return {
    createGuestBooking,
    getGuestBookingByCode,
    cancelGuestBooking,
    updateGuestBooking,
    bookingCode,
    isLoading: isCreating || isManaging,
    error: createError || manageError
  };
};
