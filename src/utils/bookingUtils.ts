
/**
 * Time Slot Utilities
 * 
 * Utility functions for generating and filtering time slots
 */

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

  // Calculate the end time of this appointment
  const endTimeInMinutes = timeInMinutes + serviceLength;

  // Debug logging
  console.log(`Checking if slot ${time} with duration ${serviceLength} minutes is booked`);
  console.log(`This appointment would end at ${Math.floor(endTimeInMinutes/60)}:${String(endTimeInMinutes % 60).padStart(2, '0')}`);

  // Check if any existing booking overlaps with this time slot
  return existingBookings.some(booking => {
    // Parse booking time
    const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
    const bookingTimeInMinutes = bookingHours * 60 + bookingMinutes;
    
    // Get booking service duration
    const bookingServiceLength = booking.services ? booking.services.duration : 60; // Default to 60 if unknown
    
    // Calculate the end time of the existing booking
    const bookingEndTimeInMinutes = bookingTimeInMinutes + bookingServiceLength;

    // Debug logging for existing bookings
    console.log(`Comparing with existing booking at ${booking.booking_time} (duration: ${bookingServiceLength}min)`);
    console.log(`Existing booking: ${bookingTimeInMinutes}-${bookingEndTimeInMinutes} mins, New booking: ${timeInMinutes}-${endTimeInMinutes} mins`);
    
    // Check if there's an overlap (any part of the new booking overlaps with any part of existing booking)
    const hasOverlap = (
      // New booking starts during an existing booking
      (timeInMinutes >= bookingTimeInMinutes && timeInMinutes < bookingEndTimeInMinutes) ||
      // New booking ends during an existing booking
      (endTimeInMinutes > bookingTimeInMinutes && endTimeInMinutes <= bookingEndTimeInMinutes) ||
      // New booking completely contains an existing booking
      (timeInMinutes <= bookingTimeInMinutes && endTimeInMinutes >= bookingEndTimeInMinutes) ||
      // New booking is completely contained by an existing booking
      (timeInMinutes >= bookingTimeInMinutes && endTimeInMinutes <= bookingEndTimeInMinutes)
    );
    
    if (hasOverlap) {
      console.log(`❌ OVERLAP DETECTED with booking at ${booking.booking_time}`);
    }
    
    return hasOverlap;
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
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching opening hours:', error);
      return false;
    }
    
    // If the barber is closed on this day or no opening hours found, return false
    if (!openingHours || openingHours.is_closed) {
      console.log(`Barber ${barberId} is closed on day ${dayOfWeek}`);
      return false;
    }
    
    // Convert time to minutes for easier comparison
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    const endTimeInMinutes = timeInMinutes + serviceDuration;
    
    // Convert opening and closing times to minutes
    const [openHours, openMinutes] = openingHours.open_time.split(':').map(Number);
    const openTimeInMinutes = openHours * 60 + openMinutes;
    
    const [closeHours, closeMinutes] = openingHours.close_time.split(':').map(Number);
    const closeTimeInMinutes = closeHours * 60 + closeMinutes;
    
    // CRITICAL LOGGING - Print exact times for debugging
    console.log(`🔍 VALIDATING TIME SLOT: ${time}, duration: ${serviceDuration} minutes`);
    console.log(`🔍 Start time: ${timeInMinutes} minutes from midnight (${hours}:${String(minutes).padStart(2, '0')})`);
    console.log(`🔍 End time: ${endTimeInMinutes} minutes from midnight (${Math.floor(endTimeInMinutes/60)}:${String(endTimeInMinutes % 60).padStart(2, '0')})`);
    console.log(`🔍 Opening hours: ${openTimeInMinutes} to ${closeTimeInMinutes} minutes from midnight (${openingHours.open_time}-${openingHours.close_time})`);
    
    // The service must start after opening time and end before or exactly at closing time
    // Fix: Changed < to <= for endTimeInMinutes to allow appointments that end exactly at closing time
    const isWithinHours = (
      timeInMinutes >= openTimeInMinutes && 
      endTimeInMinutes <= closeTimeInMinutes
    );
    
    if (!isWithinHours) {
      console.log(`❌ Time slot ${time} is outside opening hours (${openingHours.open_time}-${openingHours.close_time})`);
      if (endTimeInMinutes > closeTimeInMinutes) {
        console.log(`   Service would end at ${Math.floor(endTimeInMinutes/60)}:${String(endTimeInMinutes % 60).padStart(2, '0')}, after closing time!`);
      }
    } else {
      console.log(`✅ Time slot ${time} is within opening hours`);
    }
    
    return isWithinHours;
  } catch (error) {
    console.error('Error checking opening hours:', error);
    return false;
  }
};

// Check if a day has available time slots for the barber
export const hasAvailableSlotsOnDay = async (
  barberId: string | null,
  date: Date,
  existingBookings: ExistingBooking[],
  serviceDuration: number = 60
): Promise<boolean> => {
  if (!barberId) return false;

  try {
    // Get the day of week
    const dayOfWeek = date.getDay();
    
    // Get opening hours for this barber and day
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
    
    // If the barber is closed on this day or no opening hours found, return false
    if (!openingHours || openingHours.is_closed) {
      return false;
    }
    
    // Check basic availability first before doing more expensive checks
    return true;
  } catch (error) {
    console.error('Error checking day availability:', error);
    return false;
  }
};
