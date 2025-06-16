
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';
import { GuestBookingData } from '@/types/guestBooking';
import { InsertableBooking } from '@/supabase-types';

// Create a guest booking in the database
export const createGuestBookingInDb = async (bookingData: GuestBookingData, bookingCode: string) => {
  const { guest_name, guest_phone, ...bookingDetails } = bookingData;
  
  // Generate a random UUID for the guest user
  const guestUserId = uuidv4();

  // Store guest info in the notes field
  const newBooking: Omit<InsertableBooking, 'status'> = {
    ...bookingDetails,
    user_id: guestUserId,
    notes: bookingData.notes 
      ? `${bookingData.notes}\nGuest booking by ${guest_name} (${guest_phone}). Verification code: ${bookingCode}`
      : `Guest booking by ${guest_name} (${guest_phone}). Verification code: ${bookingCode}`
  };

  // @ts-ignore - Supabase types issue
  const { data, error } = await supabase
    .from('bookings')
    .insert({
      ...newBooking,
      status: 'confirmed',
      guest_booking: true // Mark this as a guest booking
    })
    .select();

  if (error) {
    throw new Error(error.message || 'Failed to create booking');
  }

  return data[0];
};

// Send email confirmation for a booking
export const sendBookingEmail = async (
  email: string,
  name: string,
  bookingCode: string,
  bookingId: string,
  bookingDate: string,
  bookingTime: string,
  barberName: string,
  serviceName: string
) => {
  const { error } = await supabase.functions.invoke('send-booking-email', {
    body: {
      to: email,
      name,
      bookingCode,
      bookingId,
      bookingDate,
      bookingTime,
      barberName,
      serviceName,
      isGuest: true
    }
  });

  return {
    success: !error,
    message: error ? 'Email notification failed' : 'Email notification sent'
  };
};

// Send SMS notification for a booking (only for reminders now, NOT for confirmations)
export const sendBookingSms = async (
  phone: string,
  name: string,
  bookingCode: string,
  bookingId: string,
  bookingDate: string,
  bookingTime: string,
  isUpdate = false
) => {
  // Only send SMS for reminders or updates, NOT for initial confirmations
  console.log('SMS function called - this should only be for reminders, not confirmations');
  
  const { error } = await supabase.functions.invoke('send-booking-sms', {
    body: {
      phone,
      name,
      bookingCode,
      bookingId,
      bookingDate,
      bookingTime,
      isUpdate
    }
  });

  return {
    success: !error,
    message: error ? 'SMS notification failed' : 'SMS notification sent',
    isTwilioConfigured: !error
  };
};

// Fetch guest bookings by verification code
export const fetchGuestBookingsByCode = async (phone: string, code: string) => {
  // @ts-ignore - Supabase types issue
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      *,
      barber:barber_id(name),
      service:service_id(name, price, duration)
    `)
    .eq('guest_booking', true)
    .ilike('notes', `%Verification code: ${code}%`)
    .order('booking_date', { ascending: true })
    .order('booking_time', { ascending: true });

  if (error) {
    throw new Error(error.message || 'Failed to fetch booking');
  }

  if (!bookings || bookings.length === 0) {
    throw new Error('No booking found with this verification code');
  }

  // Filter bookings to ensure the phone number matches
  const matchingBookings = bookings.filter(booking => 
    booking.notes && booking.notes.includes(`(${phone})`)
  );

  if (matchingBookings.length === 0) {
    throw new Error('No booking found with this phone number and verification code');
  }

  return matchingBookings;
};

// Cancel a guest booking
export const cancelGuestBookingInDb = async (bookingId: string) => {
  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId);

  if (error) {
    throw new Error(error.message || 'Failed to cancel booking');
  }

  return true;
};

// Update a guest booking
export const updateGuestBookingInDb = async (
  bookingId: string,
  newDate: string,
  newTime: string
) => {
  const { error } = await supabase
    .from('bookings')
    .update({ 
      booking_date: newDate,
      booking_time: newTime 
    })
    .eq('id', bookingId);

  if (error) {
    throw new Error(error.message || 'Failed to update booking');
  }

  return true;
};
