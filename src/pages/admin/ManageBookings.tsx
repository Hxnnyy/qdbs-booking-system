import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { format, isToday, isPast, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Booking } from '@/supabase-types';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

// Import our components
import { BookingsList } from '@/components/admin/BookingsList';
import { BookingFilterControls } from '@/components/admin/BookingFilterControls';
import { EventDetailsDialog } from '@/components/admin/calendar/EventDetailsDialog';
import { CalendarEvent } from '@/types/calendar';
import { bookingToCalendarEvent } from '@/utils/calendarUtils';

const ManageBookings = () => {
  const navigate = useNavigate();
  
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('today');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  
  // For the EventDetailsDialog (same as CalendarView)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Switch to using the edge function for fetching bookings
      try {
        console.log('Attempting to use edge function for fetching bookings');
        const { data, error } = await supabase.functions.invoke('get-bookings-with-profiles', {
          body: { page: 0, pageSize: 100 } // Fetch more to handle client-side filtering
        });
        
        if (error) throw error;
        
        console.log('Successfully fetched bookings with profiles from edge function:', data);
        
        // Process the data to ensure it conforms to our expected Booking type
        const processedBookings = data.bookings.map((booking: any) => {
          // Handle profile error or missing profile
          if (!booking.profile || typeof booking.profile === 'string') {
            booking.profile = {
              first_name: undefined,
              last_name: undefined,
              email: undefined,
              phone: undefined
            };
          }
          return booking as Booking;
        });
        
        setBookings(processedBookings);
        filterBookings(processedBookings, currentTab, statusFilter, typeFilter);
        return;
      } catch (edgeFnError) {
        console.error('Error using edge function, falling back to direct query:', edgeFnError);
        // Continue with the original query as fallback
      }
      
      // Fallback to direct query if edge function fails
      // @ts-ignore - Supabase types issue
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          barber:barber_id(name),
          service:service_id(name, price, duration),
          profile:user_id(first_name, last_name, email, phone)
        `)
        .order('booking_date', { ascending: false })
        .order('booking_time', { ascending: true });
      
      if (error) throw error;
      
      // Process the data to ensure profile is properly typed
      const processedBookings = (data || []).map((booking: any) => {
        if (!booking.profile) {
          booking.profile = {
            first_name: undefined,
            last_name: undefined,
            email: undefined,
            phone: undefined
          };
        }
        return booking as Booking;
      });
      
      setBookings(processedBookings);
      filterBookings(processedBookings, currentTab, statusFilter, typeFilter);
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
        isToday(parseISO(booking.booking_date)) &&
        booking.status !== 'cancelled'
      );
    } else if (tab === 'upcoming') {
      filtered = filtered.filter(booking => 
        (!isPast(parseISO(booking.booking_date)) || 
        (isToday(parseISO(booking.booking_date)) && booking.status === 'confirmed')) &&
        booking.status !== 'cancelled'
      );
    } else if (tab === 'past') {
      filtered = filtered.filter(booking => 
        isPast(parseISO(booking.booking_date)) && 
        !isToday(parseISO(booking.booking_date)) &&
        booking.status !== 'cancelled'
      );
    } else if (tab === 'cancelled') {
      filtered = filtered.filter(booking => booking.status === 'cancelled');
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
  
  const updateBooking = async (
    bookingId: string, 
    updates: { 
      title?: string; 
      barber_id?: string; 
      service_id?: string; 
      notes?: string;
      booking_date?: string;
      booking_time?: string;
      status?: string;
    }
  ) => {
    try {
      // @ts-ignore - Supabase types issue
      const { error } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', bookingId);
      
      if (error) throw error;
      
      toast.success('Booking updated successfully');
      await fetchBookings();
      return true;
    } catch (err: any) {
      console.error('Error updating booking:', err);
      toast.error('Failed to update booking');
      return false;
    }
  };
  
  const openEditDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    
    // Convert booking to calendar event format for the dialog
    try {
      const event = bookingToCalendarEvent(booking);
      setSelectedEvent(event);
      setIsDialogOpen(true);
    } catch (err) {
      console.error('Error converting booking to event:', err);
      toast.error('Could not open booking details');
    }
  };
  
  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Manage Bookings</h1>
            <Button
              onClick={() => navigate('/admin/bookings-query')}
              variant="outline"
            >
              Switch to New Bookings UI
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <Tabs 
              defaultValue="today" 
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
                  onEditBooking={openEditDialog}
                />
              </TabsContent>
              
              <TabsContent value="today" className="mt-0">
                <BookingsList 
                  bookings={filteredBookings} 
                  isLoading={isLoading} 
                  error={error}
                  onEditBooking={openEditDialog}
                />
              </TabsContent>
              
              <TabsContent value="upcoming" className="mt-0">
                <BookingsList 
                  bookings={filteredBookings} 
                  isLoading={isLoading} 
                  error={error}
                  onEditBooking={openEditDialog}
                />
              </TabsContent>
              
              <TabsContent value="past" className="mt-0">
                <BookingsList 
                  bookings={filteredBookings} 
                  isLoading={isLoading} 
                  error={error}
                  onEditBooking={openEditDialog}
                />
              </TabsContent>
              
              <TabsContent value="cancelled" className="mt-0">
                <BookingsList 
                  bookings={filteredBookings} 
                  isLoading={isLoading} 
                  error={error}
                  onEditBooking={openEditDialog}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>
        
        <EventDetailsDialog
          event={selectedEvent}
          isOpen={isDialogOpen}
          onClose={() => {
            setIsDialogOpen(false);
            setSelectedEvent(null);
            setSelectedBooking(null);
          }}
          onUpdateBooking={updateBooking}
        />
      </AdminLayout>
    </Layout>
  );
};

export default ManageBookings;
