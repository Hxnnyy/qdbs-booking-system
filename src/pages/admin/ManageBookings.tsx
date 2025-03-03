
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Booking } from '@/supabase-types';

const statusOptions = [
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no-show', label: 'No Show' }
];

const ManageBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('all');
  
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [newBookingStatus, setNewBookingStatus] = useState('');
  
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Type assertion to avoid TypeScript errors with Supabase queries
      const { data, error } = await (supabase
        .from('bookings') as any)
        .select(`
          *,
          barber:barber_id(name),
          service:service_id(name, price, duration)
        `)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: true });
      
      if (error) throw error;
      
      setBookings(data || []);
      filterBookings(data || [], currentTab, statusFilter);
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBookings();
  }, []);
  
  const filterBookings = (bookingsToFilter: Booking[], tab: string, status: string | null) => {
    let filtered = [...bookingsToFilter];
    
    // Filter by tab
    if (tab === 'today') {
      filtered = filtered.filter(booking => 
        isToday(parseISO(booking.booking_date))
      );
    } else if (tab === 'upcoming') {
      filtered = filtered.filter(booking => 
        !isPast(parseISO(booking.booking_date)) || 
        (isToday(parseISO(booking.booking_date)) && booking.status === 'confirmed')
      );
    } else if (tab === 'past') {
      filtered = filtered.filter(booking => 
        isPast(parseISO(booking.booking_date)) && 
        !isToday(parseISO(booking.booking_date))
      );
    }
    
    // Filter by status
    if (status) {
      filtered = filtered.filter(booking => booking.status === status);
    }
    
    setFilteredBookings(filtered);
  };
  
  useEffect(() => {
    filterBookings(bookings, currentTab, statusFilter);
  }, [currentTab, statusFilter, bookings]);
  
  const handleUpdateStatus = async () => {
    if (!currentBooking || !newBookingStatus) return;
    
    try {
      const bookingId = currentBooking.id;
      const newStatus = newBookingStatus;
      
      // Type assertion to avoid TypeScript errors with Supabase queries
      const { error } = await (supabase
        .from('bookings') as any)
        .update({ status: newStatus })
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast.success(`Booking status updated to ${newStatus}`);
      setIsStatusDialogOpen(false);
      await fetchBookings();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const openStatusDialog = (booking: Booking) => {
    setCurrentBooking(booking);
    setNewBookingStatus(booking.status);
    setIsStatusDialogOpen(true);
  };
  
  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Manage Bookings</h1>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs 
              defaultValue="all" 
              className="w-full" 
              onValueChange={(value) => setCurrentTab(value)}
            >
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="past">Past</TabsTrigger>
              </TabsList>
              
              <div className="flex justify-end mb-4">
                <Select onValueChange={setStatusFilter} value={statusFilter || undefined}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <TabsContent value="all" className="mt-0">
                {renderBookingsList()}
              </TabsContent>
              
              <TabsContent value="today" className="mt-0">
                {renderBookingsList()}
              </TabsContent>
              
              <TabsContent value="upcoming" className="mt-0">
                {renderBookingsList()}
              </TabsContent>
              
              <TabsContent value="past" className="mt-0">
                {renderBookingsList()}
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        {/* Update Status Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Booking Status</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="mb-4">
                Change status for booking on {currentBooking && format(parseISO(currentBooking.booking_date), 'PP')} at {currentBooking?.booking_time}
              </p>
              <Select onValueChange={setNewBookingStatus} defaultValue={currentBooking?.status}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStatusDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateStatus}>
                Update Status
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </Layout>
  );
  
  function renderBookingsList() {
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
    
    if (filteredBookings.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          No bookings found matching your criteria.
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <Card key={booking.id}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold">
                      {booking.service?.name}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    with {booking.barber?.name} on {format(parseISO(booking.booking_date), 'PP')} at {booking.booking_time}
                  </p>
                  <p className="text-sm font-medium mt-1">
                    £{booking.service?.price?.toFixed(2)} • {booking.service?.duration} min
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => openStatusDialog(booking)}
                  >
                    Update Status
                  </Button>
                </div>
              </div>
              
              {booking.notes && (
                <div className="mt-4 p-2 bg-gray-50 rounded text-sm">
                  <p className="font-medium">Notes:</p>
                  <p>{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
};

export default ManageBookings;
