
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

      // Create a simplified booking record with user_id from auth context
      const bookingRecord = {
        barber_id: bookingData.barber_id,
        service_id: bookingData.service_id,
        booking_date: bookingData.booking_date,
        booking_time: bookingData.booking_time,
        user_id: user.id,
        status: 'confirmed',
        notes: bookingData.notes || null,
        // Explicitly set guest_booking to false to ensure trigger works correctly
        guest_booking: false
      };

      console.log('Creating booking with data:', bookingRecord);

      // Insert the booking
      const { data, error: insertError } = await supabase
        .from('bookings')
        .insert([bookingRecord])
        .select();

      if (insertError) {
        console.error('Supabase error:', insertError);
        throw new Error(insertError.message || 'Failed to create booking');
      }

      console.log('Booking created successfully:', data);
      
      // Try to send confirmation email but don't fail the booking if it fails
      try {
        await sendBookingConfirmationEmail(user.id, bookingData, data[0].id);
      } catch (emailProcessingError) {
        console.error('Error in email processing:', emailProcessingError);
        // Continue with booking success even if there are email issues
      }
      
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

  // Helper function to send booking confirmation email
  const sendBookingConfirmationEmail = async (
    userId: string,
    bookingData: any,
    bookingId: string
  ) => {
    try {
      // Get profile data from profiles table only
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile data:', profileError);
        return; // Return early but don't fail
      }
        
      // Get barber and service names for the confirmation email
      const { data: barberData } = await supabase
        .from('barbers')
        .select('name')
        .eq('id', bookingData.barber_id)
        .single();
        
      const { data: serviceData } = await supabase
        .from('services')
        .select('name')
        .eq('id', bookingData.service_id)
        .single();
      
      if (profileData && profileData.email) {
        // Send confirmation email
        await supabase.functions.invoke('send-booking-email', {
          body: {
            to: profileData.email,
            name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Customer',
            bookingId: bookingId,
            bookingDate: bookingData.booking_date,
            bookingTime: bookingData.booking_time,
            barberName: barberData?.name || 'Barber',
            serviceName: serviceData?.name || 'Service',
            isGuest: false
          }
        });
        
        console.log('Confirmation email sent to registered user');
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the booking if email sending fails
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
