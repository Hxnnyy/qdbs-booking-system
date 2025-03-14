
import React from 'react';
import { BookingCard } from './BookingCard';
import { Spinner } from '@/components/ui/spinner';
import { Booking } from '@/supabase-types';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginatedBookingsListProps {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  onEditBooking: (booking: Booking) => void;
  
  // Pagination props
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

/**
 * PaginatedBookingsList Component
 * 
 * Displays a list of bookings with pagination controls
 */
export const PaginatedBookingsList: React.FC<PaginatedBookingsListProps> = ({ 
  bookings, 
  isLoading, 
  error, 
  onEditBooking,
  page,
  totalPages,
  onPageChange
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded border border-red-200 text-red-600">
        {error}
      </div>
    );
  }
  
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No bookings found matching your criteria.
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {bookings.map((booking) => (
          <BookingCard 
            key={booking.id} 
            booking={booking} 
            onEditBooking={onEditBooking} 
          />
        ))}
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <div className="text-sm">
            Page {page + 1} of {totalPages}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
};
