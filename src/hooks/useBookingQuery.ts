
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useBookingsQuery = (page: number = 0, pageSize: number = 10) => {
  return useQuery({
    queryKey: ['bookings', page, pageSize],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-bookings-with-profiles', {
          body: { page, pageSize }
        });
        
        if (error) throw new Error(error.message);
        if (!data) throw new Error('No data returned from edge function');
        
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
