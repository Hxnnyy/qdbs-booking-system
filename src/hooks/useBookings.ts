
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export type Booking = {
  id?: string;
  user_id: string | undefined;
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status?: string;
  notes?: string;
  created_at?: string;
  barber?: {
    name: string;
  };
  service?: {
    name: string;
    price: number;
    duration: number;
  };
};

export const useBookings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const createBooking = async (bookingData: Omit<Booking, 'user_id'>) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        throw new Error('You must be logged in to book an appointment');
      }

      const newBooking: Booking = {
        ...bookingData,
        user_id: user.id,
        status: 'confirmed'
      };

      const { data, error } = await supabase
        .from('bookings')
        .insert(newBooking)
        .select();

      if (error) throw error;

      toast.success('Booking created successfully');
      return data;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
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

      if (error) throw error;

      return data;
    } catch (err: any) {
      setError(err.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success('Booking cancelled successfully');
      return true;
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
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
