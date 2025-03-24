/**
 * Booking Service
 * 
 * Handles data fetching and processing related to bookings
 */

import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { CalendarEvent } from '@/types/calendar';

/**
 * Fetch bookings for a specific date and barber
 * 
 * @param barberId - The ID of the barber
 * @param date - The date to fetch bookings for
 * @returns Array of booking records
 */
export const fetchBookingsForDateAndBarber = async (
  barberId: string, 
  date: Date
): Promise<any[]> => {
  try {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('bookings')
      .select('booking_time, service_id, services(duration)')
      .eq('barber_id', barberId)
      .eq('booking_date', formattedDate)
      .eq('status', 'confirmed');
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return [];
  }
};

/**
 * Check if a date is valid for booking
 * 
 * @param date - The date to check
 * @param barberId - The ID of the barber
 * @param dayOfWeek - The day of the week (0-6)
 * @returns Object with validity status and error message
 */
export const checkDateValidity = async (
  date: Date,
  barberId: string,
  dayOfWeek: number
): Promise<{ isValid: boolean, errorMessage: string | null }> => {
  try {
    // Check if the barber works on this day
    const { data: openingHours, error } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    if (!openingHours || openingHours.is_closed) {
      return {
        isValid: false,
        errorMessage: 'The barber does not work on this day.'
      };
    }
    
    return {
      isValid: true,
      errorMessage: null
    };
  } catch (error) {
    console.error('Error checking date validity:', error);
    return {
      isValid: false,
      errorMessage: 'An error occurred while checking date validity.'
    };
  }
};

/**
 * Create a new booking
 * 
 * @param bookingData - Booking data object
 * @param userId - User ID (null for guest bookings)
 * @returns Created booking object or null on error
 */
export const createBooking = async (
  bookingData: {
    barber_id: string;
    service_id: string;
    booking_date: string;
    booking_time: string;
    notes?: string;
    guest_booking?: boolean;
    guest_name?: string;
    guest_phone?: string;
    guest_email?: string;
  },
  userId: string | null
): Promise<any> => {
  try {
    const isGuest = !userId;
    
    // Instead of using RPC or direct insert that might trigger the problematic function,
    // we'll use a different approach for registered users vs guests
    if (isGuest) {
      // For guest bookings - continue with normal insert
      const insertData = {
        barber_id: bookingData.barber_id,
        service_id: bookingData.service_id,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        status: 'confirmed',
        notes: bookingData.notes || null,
        guest_booking: true,
        user_id: userId,
        guest_email: bookingData.guest_email || null
      };
      
      console.log('Creating guest booking with data:', JSON.stringify(insertData));
      
      const { data, error } = await supabase
        .from('bookings')
        .insert(insertData)
        .select()
        .single();
      
      if (error) {
        console.error('Error inserting guest booking:', error);
        throw error;
      }
      
      return data;
    } else {
      // For logged-in users - use edge function to create the booking securely
      console.log('Creating user booking via edge function');
      
      try {
        const { data, error } = await supabase.functions.invoke('create-user-booking', {
          body: {
            booking: {
              barber_id: bookingData.barber_id,
              service_id: bookingData.service_id,
              booking_date: bookingData.booking_date,
              booking_time: bookingData.booking_time,
              status: 'confirmed',
              notes: bookingData.notes || null,
              user_id: userId
            }
          }
        });
        
        if (error) {
          console.error('Error creating booking via edge function:', error);
          throw new Error(error.message || 'Failed to create booking');
        }
        
        if (!data) {
          console.error('No data returned from edge function');
          throw new Error('Failed to create booking: No data returned');  
        }
        
        console.log('Booking created successfully via edge function:', data);
        return data;
      } catch (edgeFunctionError) {
        console.error('Edge function error details:', edgeFunctionError);
        throw edgeFunctionError;
      }
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

/**
 * Update an existing booking
 * 
 * @param bookingId - ID of the booking to update
 * @param updates - Object containing fields to update
 * @returns Success boolean
 */
export const updateBooking = async (
  bookingId: string,
  updates: {
    booking_date?: string;
    booking_time?: string;
    status?: string;
    notes?: string;
  }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error updating booking:', error);
    return false;
  }
};

/**
 * Fetch all bookings with pagination
 * 
 * @param page - Page number (starts at 0)
 * @param pageSize - Number of items per page
 * @returns Paginated bookings array and total count
 */
export const fetchPaginatedBookings = async (page = 0, pageSize = 10, filters = {}) => {
  try {
    console.log('Calling get-bookings-with-profiles edge function');
    const { data, error } = await supabase.functions.invoke('get-bookings-with-profiles', {
      body: { page, pageSize, filters }
    });

    if (error) {
      console.error('Error fetching bookings from edge function:', error);
      throw new Error(error.message || 'Failed to fetch bookings');
    }
    
    console.log('Bookings fetched successfully from edge function:', data);
    return data;
  } catch (err) {
    console.error('Unexpected error in fetchPaginatedBookings:', err);
    throw err;
  }
};
