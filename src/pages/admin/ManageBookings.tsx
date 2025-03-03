import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BookingType } from '@/types/supabase';
import { format } from 'date-fns';

interface ExtendedBooking extends BookingType {
  customer?: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
}

const ManageBookings = () => {
  const [bookings, setBookings] = useState<ExtendedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(name),
          service:service_id(name, price, duration),
          customer:user_id(email, first_name, last_name)
        `)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: true }) as unknown as { data: ExtendedBooking[] | null; error: any };
      
      if (error) throw error;
      
      setBookings(data || []);
    } catch (error: any) {
      toast.error('Error fetching bookings: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId) as unknown as { error: any };
      
      if (error) throw error;
      
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      
      toast.success(`Booking status updated to ${newStatus}`);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      (booking.customer?.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.customer?.first_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.customer?.last_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.barber?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (booking.service?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="container mx-auto py-12 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8 font-playfair">Manage Bookings</h1>
        
        <Card className="mb-8 glass shadow-subtle border border-border">
          <CardHeader>
            <CardTitle>Search & Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Search by customer, barber or service..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('all')}
                  className={statusFilter === 'all' ? 'bg-burgundy hover:bg-burgundy-light' : ''}
                >
                  All
                </Button>
                <Button 
                  variant={statusFilter === 'confirmed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('confirmed')}
                  className={statusFilter === 'confirmed' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  Confirmed
                </Button>
                <Button 
                  variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('cancelled')}
                  className={statusFilter === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  Cancelled
                </Button>
                <Button 
                  variant={statusFilter === 'completed' ? 'default' : 'outline'}
                  onClick={() => setStatusFilter('completed')}
                  className={statusFilter === 'completed' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                >
                  Completed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-12 h-12" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <Card className="glass shadow-subtle border border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No bookings found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <Card 
                key={booking.id} 
                className="glass shadow-subtle border border-border"
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                    <div className="mb-4 md:mb-0">
                      <div className="flex items-center mb-2">
                        <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                          booking.status === 'confirmed' ? 'bg-green-500' :
                          booking.status === 'cancelled' ? 'bg-red-500' :
                          booking.status === 'completed' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}></span>
                        <h2 className="text-xl font-semibold">
                          {booking.customer?.first_name} {booking.customer?.last_name}
                        </h2>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{booking.customer?.email}</p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Service:</span> {booking.service?.name} (£{booking.service?.price.toFixed(2)}, {booking.service?.duration} min)
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Barber:</span> {booking.barber?.name}
                      </p>
                      <p className="text-sm mb-1">
                        <span className="font-medium">Date & Time:</span> {format(new Date(booking.booking_date), 'PPP')} at {booking.booking_time}
                      </p>
                      {booking.notes && (
                        <div className="text-sm mt-2 p-2 bg-secondary/30 rounded-md">
                          <p className="font-medium">Notes:</p>
                          <p>{booking.notes}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col space-y-2">
                      <p className="text-sm mb-1 font-medium">Update Status:</p>
                      <div className="flex flex-col space-y-2">
                        {booking.status !== 'confirmed' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-green-600 hover:bg-green-50 justify-start"
                            onClick={() => handleUpdateStatus(booking.id!, 'confirmed')}
                          >
                            Mark as Confirmed
                          </Button>
                        )}
                        {booking.status !== 'cancelled' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:bg-red-50 justify-start"
                            onClick={() => handleUpdateStatus(booking.id!, 'cancelled')}
                          >
                            Mark as Cancelled
                          </Button>
                        )}
                        {booking.status !== 'completed' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-600 hover:bg-blue-50 justify-start"
                            onClick={() => handleUpdateStatus(booking.id!, 'completed')}
                          >
                            Mark as Completed
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ManageBookings;
