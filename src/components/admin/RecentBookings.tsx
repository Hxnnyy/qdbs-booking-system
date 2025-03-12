
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { Calendar, User, BadgeCheck, Clock, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface Booking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  guest_booking?: boolean;
  guest_email?: string;
  notes?: string;
  service?: {
    name?: string;
    price?: number;
    duration?: number;
  };
  barber?: {
    name?: string;
  };
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
  
  // Helper to extract guest name from booking notes if available
  const getGuestName = (booking: Booking) => {
    if (!booking.guest_booking || !booking.notes) return null;
    
    const nameMatch = booking.notes.match(/Guest booking by ([^(]+)/);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }
    return null;
  };
  
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
          <BadgeCheck className="mr-1 h-3 w-3" />Confirmed
        </span>;
      case 'completed':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">Completed</span>;
      case 'cancelled':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">Cancelled</span>;
      case 'no-show':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">No-show</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100">Pending</span>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Bookings</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/bookings">View all</Link>
        </Button>
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
                  
                  <div className="flex flex-wrap gap-x-4 text-sm text-muted-foreground">
                    {booking.barber?.name && (
                      <div className="flex items-center">
                        <Scissors className="mr-1 h-3 w-3" />
                        <span>{booking.barber.name}</span>
                      </div>
                    )}
                    
                    {booking.service?.duration && (
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        <span>{booking.service.duration} min</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-1 h-3 w-3" />
                    <span>
                      {format(parseISO(booking.booking_date), 'PP')} at {booking.booking_time}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <User className="mr-1 h-3 w-3" />
                      <span>
                        {booking.guest_booking 
                          ? getGuestName(booking) || 'Guest'
                          : 'Customer'}
                      </span>
                    </div>
                    
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
            <p>No upcoming bookings available.</p>
            <Button variant="link" size="sm" className="mt-2" asChild>
              <Link to="/admin/bookings">Manage bookings</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
