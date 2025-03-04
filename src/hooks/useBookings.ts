
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Booking, InsertableBooking, UpdatableBooking } from '@/supabase-types';

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

      const newBooking: InsertableBooking = {
        ...bookingData,
        user_id: user.id,
        status: 'confirmed'
      };

      console.log('Creating booking with data:', newBooking);

      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('bookings')
        .insert(newBooking)
        .select();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message || 'Failed to create booking');
      }

      console.log('Booking created successfully:', data);
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
      return data;
    } catch (err: any) {
      console.error('Error in getUserBookings:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to fetch your bookings');
      return [];
    } finally {
      setIsLoading(false);
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
    cancelBooking,
    isLoading,
    error
  };
};
