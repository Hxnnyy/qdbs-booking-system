
import React from 'react';
import { BookingCard } from './BookingCard';
import { Spinner } from '@/components/ui/spinner';
import { Booking } from '@/supabase-types';

interface BookingsListProps {
  bookings: Booking[];
  isLoading: boolean;
  error: string | null;
  onUpdateStatus: (booking: Booking) => void;
}

export const BookingsList: React.FC<BookingsListProps> = ({ 
  bookings, 
  isLoading, 
  error, 
  onUpdateStatus 
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
    <div className="space-y-4">
      {bookings.map((booking) => (
        <BookingCard 
          key={booking.id} 
          booking={booking} 
          onUpdateStatus={onUpdateStatus} 
        />
      ))}
    </div>
  );
};
