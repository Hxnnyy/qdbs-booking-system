
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service?: {
    name?: string;
    price?: number;
  };
}

interface RecentBookingsProps {
  bookings: Booking[];
}

export const RecentBookings: React.FC<RecentBookingsProps> = ({ bookings }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Bookings</CardTitle>
      </CardHeader>
      <CardContent>
        {bookings.length > 0 ? (
          <div className="space-y-2">
            {bookings.map((booking) => (
              <div key={booking.id} className="border-b pb-2 last:border-0">
                <p className="font-medium">
                  {booking.service?.name} - £{booking.service?.price?.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(booking.booking_date), 'PP')} at {booking.booking_time}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">
            No recent bookings available.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
