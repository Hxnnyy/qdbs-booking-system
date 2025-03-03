import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Calendar, Clock, User, CheckCircle, XCircle, Filter } from 'lucide-react';
import { format, parseISO, addDays } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useBarbers } from '@/hooks/useBarbers';
import { Badge } from '@/components/ui/badge';

type ExtendedBooking = {
  id: string;
  user_id: string;
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes?: string;
  created_at: string;
  barber: {
    name: string;
  };
  service: {
    name: string;
    price: number;
    duration: number;
  };
  profile: {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
};

const ManageBookings = () => {
  const [bookings, setBookings] = useState<ExtendedBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<ExtendedBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterBarber, setFilterBarber] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { barbers } = useBarbers();
  
  // Fetch all bookings
  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            *,
            barber:barber_id(name),
            service:service_id(name, price, duration),
            profile:user_id(first_name, last_name, email, phone)
          `)
          .order('booking_date', { ascending: true })
          .order('booking_time', { ascending: true }) as { data: ExtendedBooking[] | null; error: any };
        
        if (error) throw error;
        
        setBookings(data || []);
        setFilteredBookings(data || []);
      } catch (error: any) {
        console.error('Error fetching bookings:', error.message);
        toast.error('Failed to load bookings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBookings();
  }, []);
  
  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId) as { error: any };
      
      if (error) throw error;
      
      // Update local state
      setBookings(bookings.map(booking => 
        booking.id === bookingId ? { ...booking, status: newStatus } : booking
      ));
      
      toast.success(`Booking marked as ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating booking status:', error.message);
      toast.error('Failed to update booking status');
    }
  };
  
  // Get today's, upcoming and past bookings
  const today = new Date().toISOString().split('T')[0];
  const todayBookings = filteredBookings.filter(b => b.booking_date === today);
  const upcomingBookings = filteredBookings.filter(b => b.booking_date > today);
  const pastBookings = filteredBookings.filter(b => b.booking_date < today);
  
  // Format time from "14:30:00" to "2:30 PM"
  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    let hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${minutes} ${ampm}`;
  };
  
  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'completed':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };
  
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2 font-playfair">Manage Bookings</h1>
            <p className="text-muted-foreground font-playfair">
              View and manage all appointments
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={filterBarber} onValueChange={setFilterBarber}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by barber" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Barbers</SelectItem>
                {barbers.map(barber => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : filteredBookings.length > 0 ? (
          <Tabs defaultValue="today" className="space-y-6">
            <TabsList className="grid grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="today">Today ({todayBookings.length})</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming ({upcomingBookings.length})</TabsTrigger>
              <TabsTrigger value="past">Past ({pastBookings.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="today" className="space-y-4">
              {todayBookings.length > 0 ? (
                todayBookings.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onUpdateStatus={handleUpdateStatus} 
                    formatTime={formatTime}
                    getStatusColor={getStatusColor}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No bookings for today</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="upcoming" className="space-y-4">
              {upcomingBookings.length > 0 ? (
                upcomingBookings.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onUpdateStatus={handleUpdateStatus} 
                    formatTime={formatTime}
                    getStatusColor={getStatusColor}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No upcoming bookings</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="past" className="space-y-4">
              {pastBookings.length > 0 ? (
                pastBookings.map(booking => (
                  <BookingCard 
                    key={booking.id} 
                    booking={booking} 
                    onUpdateStatus={handleUpdateStatus} 
                    formatTime={formatTime}
                    getStatusColor={getStatusColor}
                  />
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No past bookings</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No bookings found</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

interface BookingCardProps {
  booking: ExtendedBooking;
  onUpdateStatus: (bookingId: string, newStatus: string) => Promise<void>;
  formatTime: (timeStr: string) => string;
  getStatusColor: (status: string) => string;
}

const BookingCard = ({ booking, onUpdateStatus, formatTime, getStatusColor }: BookingCardProps) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <User className="h-4 w-4 text-burgundy" />
              <span className="font-medium">
                {booking.profile.first_name} {booking.profile.last_name}
              </span>
              <Badge 
                variant="outline" 
                className={`ml-2 ${getStatusColor(booking.status)}`}
              >
                {booking.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-burgundy" />
                <span>{format(parseISO(booking.booking_date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-burgundy" />
                <span>{formatTime(booking.booking_time)}</span>
              </div>
              
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-burgundy" />
                <span>Barber: {booking.barber.name}</span>
              </div>
              
              <div className="flex items-center">
                <span className="text-burgundy font-medium mr-2">
                  £{booking.service.price.toFixed(2)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {booking.service.name} ({booking.service.duration} min)
                </span>
              </div>
            </div>
            
            {booking.notes && (
              <div className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium">Notes:</span> {booking.notes}
              </div>
            )}
          </div>
          
          <div className="flex flex-row md:flex-col gap-2 mt-2 md:mt-0">
            {booking.status === 'confirmed' && (
              <>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onUpdateStatus(booking.id, 'completed')}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Mark Completed
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <XCircle className="h-4 w-4 mr-1" /> Cancel
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel booking?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will mark the booking as cancelled. Are you sure?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>No, keep it</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => onUpdateStatus(booking.id, 'cancelled')}
                        className="bg-red-500 hover:bg-red-600"
                      >
                        Yes, cancel it
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            
            {booking.status === 'cancelled' && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onUpdateStatus(booking.id, 'confirmed')}
              >
                Restore Booking
              </Button>
            )}
            
            {booking.status === 'completed' && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1">
                Completed
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManageBookings;
