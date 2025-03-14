/**
 * useBookingQuery Hook
 * 
 * A React Query based hook for fetching and managing bookings
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  fetchPaginatedBookings, 
  createBooking, 
  updateBooking 
} from '@/services/bookingService';
import { toast } from 'sonner';

/**
 * Hook for fetching paginated bookings with React Query
 * 
 * @param page - Current page number (starting at 0)
 * @param pageSize - Number of items per page
 * @returns Query result containing bookings, loading state, and pagination info
 */
export const useBookingsQuery = (page: number = 0, pageSize: number = 10) => {
  return useQuery({
    queryKey: ['bookings', page, pageSize],
    queryFn: () => fetchPaginatedBookings(page, pageSize),
    // In v5, keepPreviousData is replaced with placeholderData: 'keepPrevious'
    placeholderData: keepPreviousPageData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    meta: {
      errorMessage: 'Failed to load bookings'
    }
  });
};

// Helper function to implement the keepPreviousData behavior in v5
const keepPreviousPageData = (previousData: any) => previousData;

/**
 * Hook for creating a new booking with React Query
 * 
 * @returns Mutation result and function to create booking
 */
export const useCreateBookingMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      bookingData, 
      userId 
    }: { 
      bookingData: any; 
      userId: string | null;
    }) => createBooking(bookingData, userId),
    onSuccess: () => {
      // Invalidate and refetch bookings queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create booking');
    }
  });
};

/**
 * Hook for updating an existing booking with React Query
 * 
 * @returns Mutation result and function to update booking
 */
export const useUpdateBookingMutation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      bookingId, 
      updates 
    }: { 
      bookingId: string; 
      updates: any;
    }) => updateBooking(bookingId, updates),
    onSuccess: () => {
      // Invalidate and refetch bookings queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update booking');
    }
  });
};
