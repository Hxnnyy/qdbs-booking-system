
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Booking } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';
import { bookingToCalendarEvent } from '@/utils/calendarUtils';

// Import our components
import { PaginatedBookingsList } from '@/components/admin/PaginatedBookingsList';
import { BookingFilterControls } from '@/components/admin/BookingFilterControls';
import { EventDetailsDialog } from '@/components/admin/calendar/EventDetailsDialog';
import { useBookingsQuery, useUpdateBookingMutation } from '@/hooks/useBookingQuery';

/**
 * ManageBookingsWithQuery Page
 * 
 * Enhanced version of the ManageBookings page using React Query for data fetching
 */
const ManageBookingsWithQuery = () => {
  // State
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [currentTab, setCurrentTab] = useState('today');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  
  // React Query hooks
  const { 
    data, 
    isLoading, 
    error 
  } = useBookingsQuery(page, pageSize);
  
  const updateBookingMutation = useUpdateBookingMutation();
  
  // Dialog state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Get filtered bookings from the fetched data
  const bookings = data?.bookings || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // Apply client-side filters (we could move this to the server later)
  const filteredBookings = bookings.filter(booking => {
    // Filter logic here (same as in the original ManageBookings.tsx)
    return true; // Placeholder - implement actual filtering
  });
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Handle booking update
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
      await updateBookingMutation.mutateAsync({ bookingId, updates });
      return true;
    } catch (err) {
      return false;
    }
  };
  
  // Open edit dialog
  const openEditDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    
    // Convert booking to calendar event format for the dialog
    try {
      const event = bookingToCalendarEvent(booking);
      setSelectedEvent(event);
      setIsDialogOpen(true);
    } catch (err) {
      toast.error('Could not open booking details');
    }
  };
  
  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Manage Bookings</h1>
          
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
                <PaginatedBookingsList 
                  bookings={filteredBookings} 
                  isLoading={isLoading} 
                  error={error?.message || null}
                  onEditBooking={openEditDialog}
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </TabsContent>
              
              {/* Repeat for other tabs */}
              {['today', 'upcoming', 'past', 'cancelled'].map(tab => (
                <TabsContent key={tab} value={tab} className="mt-0">
                  <PaginatedBookingsList 
                    bookings={filteredBookings} 
                    isLoading={isLoading} 
                    error={error?.message || null}
                    onEditBooking={openEditDialog}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </TabsContent>
              ))}
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

export default ManageBookingsWithQuery;
