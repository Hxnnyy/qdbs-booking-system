
import React from 'react';
import { Button } from '@/components/ui/button';
import BookingCard from './BookingCard';

interface BookingsListProps {
  bookings: any[];
  isCancelling: boolean;
  onCancelBooking: (bookingId: string) => void;
  onVerifyAnother: () => void;
}

const BookingsList: React.FC<BookingsListProps> = ({
  bookings,
  isCancelling,
  onCancelBooking,
  onVerifyAnother,
}) => {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-playfair">Your Bookings</h2>
        <Button
          variant="outline"
          onClick={onVerifyAnother}
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
            <BookingCard
              key={booking.id}
              booking={booking}
              isCancelling={isCancelling}
              onCancelBooking={onCancelBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsList;
