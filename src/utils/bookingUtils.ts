
import { Service } from '@/supabase-types';
import { ExistingBooking } from '@/types/booking';

export const isTimeSlotBooked = (
  time: string, 
  selectedServiceDetails: Service | null, 
  existingBookings: ExistingBooking[]
): boolean => {
  if (!selectedServiceDetails || !existingBookings.length) return false;

  // Convert current time slot to minutes for easier calculation
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  const serviceLength = selectedServiceDetails.duration;

  // Check if any existing booking overlaps with this time slot
  return existingBookings.some(booking => {
    const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
    const bookingTimeInMinutes = bookingHours * 60 + bookingMinutes;
    const bookingServiceLength = booking.services ? booking.services.duration : 60; // Default to 60 if unknown
    
    // Check if there's an overlap
    return (
      (timeInMinutes >= bookingTimeInMinutes && 
       timeInMinutes < bookingTimeInMinutes + bookingServiceLength) ||
      (timeInMinutes + serviceLength > bookingTimeInMinutes && 
       timeInMinutes < bookingTimeInMinutes)
    );
  });
};

export const getStepTitle = (step: string): string => {
  switch (step) {
    case 'barber':
      return 'Choose Your Barber';
    case 'service':
      return 'Select a Service';
    case 'datetime':
      return 'Pick Date & Time';
    case 'guest-info':
      return 'Your Information';
    case 'verify-phone':
      return 'Verify Your Phone Number';
    case 'notes':
      return 'Additional Information';
    case 'confirmation':
      return 'Booking Confirmation';
    default:
      return '';
  }
};
