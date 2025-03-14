
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
    
    const insertData = {
      barber_id: bookingData.barber_id,
      service_id: bookingData.service_id,
      booking_date: bookingData.booking_date,
      booking_time: bookingData.booking_time,
      status: 'confirmed',
      notes: bookingData.notes || null,
      guest_booking: isGuest,
      user_id: userId || '00000000-0000-0000-0000-000000000000', // Guest user ID for guests
      guest_email: bookingData.guest_email || null
    };
    
    const { data, error } = await supabase
      .from('bookings')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
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
export const fetchPaginatedBookings = async (
  page: number = 0,
  pageSize: number = 10
): Promise<{ bookings: any[], totalCount: number }> => {
  try {
    // Get the total count first
    const { count, error: countError } = await supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      throw countError;
    }
    
    // Then get the paginated data
    const from = page * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        barber:barber_id(name),
        service:service_id(name, price, duration)
      `)
      .order('booking_date', { ascending: false })
      .order('booking_time', { ascending: true })
      .range(from, to);
    
    if (error) {
      throw error;
    }
    
    return {
      bookings: data || [],
      totalCount: count || 0
    };
  } catch (error) {
    console.error('Error fetching paginated bookings:', error);
    return { bookings: [], totalCount: 0 };
  }
};
