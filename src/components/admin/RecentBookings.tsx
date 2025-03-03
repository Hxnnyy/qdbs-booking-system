
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Calendar, User, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  service?: {
    name?: string;
    price?: number;
  };
  customer_name?: string;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

interface RecentBookingsProps {
  bookings: Booking[];
  maxItems?: number;
}

export const RecentBookings: React.FC<RecentBookingsProps> = ({ 
  bookings, 
  maxItems = 5 
}) => {
  const displayedBookings = bookings.slice(0, maxItems);
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
          <BadgeCheck className="mr-1 h-3 w-3" />Confirmed
        </span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">Cancelled</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">Pending</span>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Bookings</CardTitle>
        <Button variant="ghost" size="sm">View all</Button>
      </CardHeader>
      <CardContent>
        {displayedBookings.length > 0 ? (
          <div className="space-y-4">
            {displayedBookings.map((booking) => (
              <div key={booking.id} className="flex items-start space-x-4 rounded-lg border p-3 transition-all hover:bg-accent/50">
                <div className="rounded-full p-2 bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {booking.service?.name || 'Unnamed Service'}
                    </p>
                    <span className="text-sm font-medium">
                      £{booking.service?.price?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>
                      {format(new Date(booking.booking_date), 'PP')} at {booking.booking_time}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    {booking.customer_name && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <User className="mr-1 h-3 w-3" />
                        <span>{booking.customer_name}</span>
                      </div>
                    )}
                    
                    <div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mb-2 opacity-20" />
            <p>No recent bookings available.</p>
            <Button variant="link" size="sm" className="mt-2">Create a booking</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
