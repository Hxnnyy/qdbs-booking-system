
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { CalendarViewComponent } from '@/components/admin/calendar/CalendarViewComponent';
import { EventDetailsDialog } from '@/components/admin/calendar/EventDetailsDialog';
import { BarberFilter } from '@/components/admin/calendar/BarberFilter';
import { CalendarSettingsProvider } from '@/context/CalendarSettingsContext';

const CalendarView = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const {
    calendarEvents,
    isLoading,
    handleEventDrop,
    handleEventClick,
    updateBooking,
    selectedEvent,
    setSelectedEvent,
    isDialogOpen,
    setIsDialogOpen,
    selectedBarberId,
    setSelectedBarberId,
    setCurrentViewDate,
    fetchBookings
  } = useCalendarBookings();

  // Function to trigger a refresh of the calendar events
  const refreshCalendar = () => {
    console.log('Triggering calendar refresh');
    setRefreshTrigger(prev => prev + 1);
    fetchBookings();
  };

  const handleDateChange = (date: Date) => {
    console.log('Date changed in main CalendarView component:', date);
    setCurrentViewDate(date);
    refreshCalendar();
  };

  // Enhanced event drop handler that refreshes the calendar
  const handleEnhancedEventDrop = (event, newStart, newEnd) => {
    handleEventDrop(event, newStart, newEnd);
    // Refresh after a short delay to allow state updates to complete
    setTimeout(() => refreshCalendar(), 100);
  };

  // Enhanced barber filter handler
  const handleBarberFilter = (barberId: string | null) => {
    setSelectedBarberId(barberId);
    // Refresh after a short delay to allow state updates to complete
    setTimeout(() => refreshCalendar(), 100);
  };

  // Wrapper function to make sure we return a Promise<boolean>
  const handleUpdateBooking = async (bookingId: string, updates: { 
    title?: string; 
    barber_id?: string; 
    service_id?: string; 
    notes?: string;
    booking_date?: string;
    booking_time?: string;
    status?: string;
  }) => {
    // Call the original updateBooking function which returns a Promise<boolean>
    const result = await updateBooking(bookingId, updates);
    // Return the result to satisfy the Promise<boolean> requirement
    return result;
  };

  return (
    <Layout>
      <AdminLayout>
        <CalendarSettingsProvider>
          <div className="space-y-6">
            <h1 className="text-3xl font-bold">Calendar View</h1>
            
            <p className="text-muted-foreground">
              View and manage appointments in calendar format. Drag and drop to reschedule.
            </p>
            
            <BarberFilter 
              selectedBarberId={selectedBarberId} 
              onSelectBarber={handleBarberFilter} 
            />
            
            <CalendarViewComponent
              key={`calendar-view-${refreshTrigger}`}
              events={calendarEvents}
              isLoading={isLoading}
              onEventDrop={handleEnhancedEventDrop}
              onEventClick={handleEventClick}
              onDateChange={handleDateChange}
              refreshCalendar={refreshCalendar}
            />
            
            <EventDetailsDialog
              event={selectedEvent}
              isOpen={isDialogOpen}
              onClose={() => {
                setIsDialogOpen(false);
                setSelectedEvent(null);
              }}
              onUpdateBooking={handleUpdateBooking}
            />
          </div>
        </CalendarSettingsProvider>
      </AdminLayout>
    </Layout>
  );
};

export default CalendarView;
