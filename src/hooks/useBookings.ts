import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Booking, InsertableBooking, UpdatableBooking } from '@/supabase-types';
import { createBooking as createBookingService } from '@/services/bookingService';

export type { Booking };

export const useBookings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createBooking = async (bookingData: Omit<InsertableBooking, 'user_id' | 'status'>) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('You must be logged in to book an appointment');
      }

      // Create a simplified booking record with user_id from auth context
      const bookingRecord = {
        barber_id: bookingData.barber_id,
        service_id: bookingData.service_id,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        notes: bookingData.notes || null,
      };

      console.log('Creating booking with data:', bookingRecord);

      // Use the service function that delegates to edge function for registered users
      const data = await createBookingService(bookingRecord, user.id);
      
      console.log('Booking created successfully:', data);
      
      toast.success('Booking created successfully!');
      return data;
    } catch (err: any) {
      console.error('Error in createBooking:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to create booking');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getUserBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('You must be logged in to view your bookings');
      }

      console.log('Fetching bookings for user:', user.id);

      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(name),
          service:service_id(name, price, duration)
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to fetch bookings');
      }

      console.log('Fetched user bookings:', data);
      return data || [];
    } catch (err: any) {
      console.error('Error in getUserBookings:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to fetch your bookings');
      
      // Return empty array instead of throwing so UI can handle it
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getUserBookingsWithRetry = async (retryCount = 0, maxRetries = 3) => {
    try {
      if (!user) {
        throw new Error('You must be logged in to view your bookings');
      }

      console.log('Fetching bookings for user (with retry):', user.id);

      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(name),
          service:service_id(name, price, duration)
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        
        // Retry on network errors
        if (retryCount < maxRetries && (error.message.includes('Failed to fetch') || error.message.includes('network'))) {
          console.log(`Retrying fetch (${retryCount + 1}/${maxRetries})...`);
          // Exponential backoff
          const delay = Math.pow(2, retryCount) * 1000; 
          await new Promise(resolve => setTimeout(resolve, delay));
          return getUserBookingsWithRetry(retryCount + 1, maxRetries);
        }
        
        throw new Error(error.message || 'Failed to fetch bookings');
      }

      console.log('Fetched user bookings:', data);
      return data || [];
    } catch (err: any) {
      console.error('Error in getUserBookingsWithRetry:', err);
      
      // Don't show toast for network errors if we're retrying
      if (retryCount >= maxRetries || (!err.message.includes('Failed to fetch') && !err.message.includes('network'))) {
        toast.error(err.message || 'Failed to fetch your bookings');
      }
      
      // Return empty array instead of throwing so UI can handle it
      return [];
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('You must be logged in to cancel a booking');
      }

      const updateData: UpdatableBooking = { status: 'cancelled' };

      console.log('Cancelling booking:', bookingId);

      // @ts-ignore - Supabase types issue
      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to cancel booking');
      }

      toast.success('Booking cancelled successfully');
      return true;
    } catch (err: any) {
      console.error('Error in cancelBooking:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to cancel booking');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createBooking,
    getUserBookings,
    getUserBookingsWithRetry,
    cancelBooking,
    isLoading,
    error
  };
};
