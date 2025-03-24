
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBookingsQuery = (page: number = 0, pageSize: number = 10) => {
  return useQuery({
    queryKey: ['bookings', page, pageSize],
    queryFn: async () => {
      try {
        console.log('Calling edge function to get bookings with profiles');
        
        const { data, error } = await supabase.functions.invoke('get-bookings-with-profiles', {
          body: { page, pageSize }
        });
        
        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message);
        }
        
        if (!data) {
          console.error('No data returned from edge function');
          throw new Error('No data returned from edge function');
        }
        
        console.log('Edge function returned data:', {
          totalCount: data.totalCount,
          bookingsCount: data.bookings?.length || 0
        });
        
        // Log the first booking as a sample to verify profile data
        if (data.bookings && data.bookings.length > 0) {
          const sampleBooking = data.bookings[0];
          console.log('Sample booking data:', {
            id: sampleBooking.id,
            userId: sampleBooking.user_id,
            guestBooking: sampleBooking.guest_booking,
            hasProfile: !!sampleBooking.profile,
            profileData: sampleBooking.profile ? {
              firstName: sampleBooking.profile.first_name,
              lastName: sampleBooking.profile.last_name,
              email: sampleBooking.profile.email
            } : null
          });
        }
        
        return data;
      } catch (err: any) {
        console.error('Error fetching bookings:', err);
        throw new Error(err.message || 'Failed to fetch bookings');
      }
    }
  });
};

export const useUpdateBookingMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      bookingId, 
      updates 
    }: { 
      bookingId: string; 
      updates: any; 
    }) => {
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);
      
      if (error) throw error;
      return true;
    },
    onSuccess: () => {
      toast.success('Booking updated successfully');
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (error: any) => {
      toast.error(`Error updating booking: ${error.message}`);
      throw error;
    }
  });
};
