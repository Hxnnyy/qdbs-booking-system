
import React from 'react';
import { Button } from '@/components/ui/button';
import BookingStatusCard from './BookingStatusCard';

interface BookingsListProps {
  bookings: any[];
  onResetVerification: () => void;
  onModify: (booking: any) => void;
  onCancel: (bookingId: string) => void;
  isCancelling: boolean;
}

const BookingsList: React.FC<BookingsListProps> = ({
  bookings,
  onResetVerification,
  onModify,
  onCancel,
  isCancelling
}) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-playfair">Your Bookings</h2>
        <Button
          variant="outline"
          onClick={onResetVerification}
        >
          Verify Another Booking
        </Button>
      </div>
      
      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">No bookings found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <BookingStatusCard
              key={booking.id}
              booking={booking}
              onModify={onModify}
              onCancel={onCancel}
              isCancelling={isCancelling}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsList;
