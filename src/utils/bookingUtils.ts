
import { Service } from '@/supabase-types';
import { ExistingBooking } from '@/types/booking';
import { format, parse } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

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

// Check if a time slot is within the barber's opening hours
export const isWithinOpeningHours = async (
  barberId: string | null,
  date: Date,
  time: string,
  serviceDuration: number = 60
): Promise<boolean> => {
  if (!barberId) return false;

  try {
    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = date.getDay();
    
    // Get opening hours for this barber and day
    const { data: openingHours, error } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle(); // Changed from .single() to .maybeSingle() to handle cases where no hours exist
    
    if (error) {
      console.error('Error fetching opening hours:', error);
      return false;
    }
    
    // If no opening hours found or the barber is closed on this day, return false
    if (!openingHours || openingHours.is_closed) {
      return false;
    }
    
    // Convert time to minutes for easier comparison
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    
    // Convert opening and closing times to minutes
    const [openHours, openMinutes] = openingHours.open_time.split(':').map(Number);
    const openTimeInMinutes = openHours * 60 + openMinutes;
    
    const [closeHours, closeMinutes] = openingHours.close_time.split(':').map(Number);
    const closeTimeInMinutes = closeHours * 60 + closeMinutes;
    
    // Check if time is within opening hours
    // Also ensure the appointment ends before closing time
    return (
      timeInMinutes >= openTimeInMinutes && 
      timeInMinutes + serviceDuration <= closeTimeInMinutes
    );
  } catch (error) {
    console.error('Error checking opening hours:', error);
    return false;
  }
};

// New function to check if a barber has any available slots on a specific day
export const hasAvailableSlotsOnDay = async (
  barberId: string | null,
  date: Date,
  serviceDuration: number = 60
): Promise<boolean> => {
  if (!barberId) return false;

  try {
    // Get the day of week
    const dayOfWeek = date.getDay();
    
    // Check if barber works on this day
    const { data: openingHours, error } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching opening hours:', error);
      return false;
    }
    
    // If no opening hours found or the barber is closed on this day, return false
    if (!openingHours || openingHours.is_closed) {
      return false;
    }
    
    // If barber works on this day, we consider it as having available slots
    return true;
  } catch (error) {
    console.error('Error checking available slots:', error);
    return false;
  }
};
