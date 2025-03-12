
import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

interface BookingStatusCardProps {
  booking: any;
  onModify: () => void;
  onCancel: (bookingId: string) => void;
  isCancelling: boolean;
}

const BookingStatusCard: React.FC<BookingStatusCardProps> = ({
  booking,
  onModify,
  onCancel,
  isCancelling
}) => {
  if (!booking) {
    return null;
  }
  
  return (
    <Card key={booking.id} className="overflow-hidden">
      <div 
        className={`h-2 ${
          booking.status === 'confirmed' 
            ? 'bg-green-500' 
            : booking.status === 'cancelled' 
              ? 'bg-red-500' 
              : 'bg-yellow-500'
        }`}
      />
      <CardContent className="p-6">
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">Appointment with</p>
          <h3 className="text-lg font-semibold">{booking.barber?.name}</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-4">
          <div className="text-muted-foreground">Service:</div>
          <div>{booking.service?.name}</div>
          
          <div className="text-muted-foreground">Date:</div>
          <div>
            {format(new Date(booking.booking_date), 'MMMM d, yyyy')}
          </div>
          
          <div className="text-muted-foreground">Time:</div>
          <div>{booking.booking_time}</div>
          
          <div className="text-muted-foreground">Price:</div>
          <div>£{booking.service?.price.toFixed(2)}</div>
          
          <div className="text-muted-foreground">Status:</div>
          <div className={`font-medium ${
            booking.status === 'confirmed' 
              ? 'text-green-600' 
              : booking.status === 'cancelled' 
                ? 'text-red-600' 
                : 'text-yellow-600'
          }`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </div>
        </div>
        
        {booking.status === 'confirmed' && (
          <div className="flex flex-col space-y-2 items-center">
            <Button
              variant="default"
              className="bg-burgundy hover:bg-burgundy-light w-full"
              onClick={onModify}
            >
              Modify Booking
            </Button>
            
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => onCancel(booking.id)}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Cancelling...
                </>
              ) : (
                'Cancel Booking'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BookingStatusCard;
