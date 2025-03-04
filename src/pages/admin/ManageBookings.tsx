
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Booking } from '@/supabase-types';

// Import our new components
import { BookingsList } from '@/components/admin/BookingsList';
import { BookingFilterControls } from '@/components/admin/BookingFilterControls';
import { StatusUpdateDialog } from '@/components/admin/StatusUpdateDialog';

const ManageBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [currentBooking, setCurrentBooking] = useState<Booking | null>(null);
  const [newBookingStatus, setNewBookingStatus] = useState('');
  
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(name),
          service:service_id(name, price, duration)
        `)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: true });
      
      if (error) throw error;
      
      setBookings(data || []);
      filterBookings(data || [], currentTab, statusFilter, typeFilter);
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
  
  const filterBookings = (bookingsToFilter: Booking[], tab: string, status: string | null, type: string | null) => {
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
    if (status && status !== 'all') {
      filtered = filtered.filter(booking => booking.status === status);
    }
    
    // Filter by booking type
    if (type && type !== 'all') {
      if (type === 'guest') {
        filtered = filtered.filter(booking => booking.guest_booking === true);
      } else if (type === 'user') {
        filtered = filtered.filter(booking => booking.guest_booking !== true);
      }
    }
    
    setFilteredBookings(filtered);
  };
  
  useEffect(() => {
    filterBookings(bookings, currentTab, statusFilter, typeFilter);
  }, [currentTab, statusFilter, typeFilter, bookings]);
  
  const handleUpdateStatus = async () => {
    if (!currentBooking || !newBookingStatus) return;
    
    try {
      const bookingId = currentBooking.id;
      const newStatus = newBookingStatus;
      
      // @ts-ignore - Supabase types issue
      const { error } = await supabase
        .from('bookings')
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
              <BookingFilterControls
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                typeFilter={typeFilter}
                setTypeFilter={setTypeFilter}
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
              />
              
              <TabsContent value="all" className="mt-0">
                <BookingsList 
                  bookings={filteredBookings} 
                  isLoading={isLoading} 
                  error={error}
                  onUpdateStatus={openStatusDialog}
                />
              </TabsContent>
              
              <TabsContent value="today" className="mt-0">
                <BookingsList 
                  bookings={filteredBookings} 
                  isLoading={isLoading} 
                  error={error}
                  onUpdateStatus={openStatusDialog}
                />
              </TabsContent>
              
              <TabsContent value="upcoming" className="mt-0">
                <BookingsList 
                  bookings={filteredBookings} 
                  isLoading={isLoading} 
                  error={error}
                  onUpdateStatus={openStatusDialog}
                />
              </TabsContent>
              
              <TabsContent value="past" className="mt-0">
                <BookingsList 
                  bookings={filteredBookings} 
                  isLoading={isLoading} 
                  error={error}
                  onUpdateStatus={openStatusDialog}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <StatusUpdateDialog
          isOpen={isStatusDialogOpen}
          setIsOpen={setIsStatusDialogOpen}
          booking={currentBooking}
          newStatus={newBookingStatus}
          setNewStatus={setNewBookingStatus}
          onUpdateStatus={handleUpdateStatus}
        />
      </AdminLayout>
    </Layout>
  );
};

export default ManageBookings;
