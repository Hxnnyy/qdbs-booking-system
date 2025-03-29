
import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { CalendarViewComponent } from '@/components/admin/calendar/CalendarViewComponent';
import { EventDetailsDialog } from '@/components/admin/calendar/EventDetailsDialog';
import { BarberFilter } from '@/components/admin/calendar/BarberFilter';
import { CalendarSettingsProvider } from '@/context/CalendarSettingsContext';
import { toast } from 'sonner';

const CalendarView = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshInProgressRef = useRef(false);
  
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

  // Log initial render state
  useEffect(() => {
    console.log('Calendar view render state:', { 
      isLoading, 
      eventsCount: calendarEvents?.length || 0,
      refreshTrigger
    });
  }, [isLoading, calendarEvents, refreshTrigger]);

  // Controlled refresh function with debounce to prevent recursive calls
  const refreshCalendar = () => {
    // If a refresh is already in progress or scheduled, don't trigger another one
    if (refreshInProgressRef.current || refreshTimeoutRef.current) {
      console.log('Refresh already in progress or scheduled, skipping');
      return;
    }
    
    console.log('Scheduling controlled calendar refresh');
    refreshInProgressRef.current = true;
    
    // Use the timeout to debounce multiple calls
    refreshTimeoutRef.current = setTimeout(() => {
      console.log('Executing calendar refresh');
      setRefreshTrigger(prev => prev + 1);
      
      try {
        fetchBookings();
        toast.success('Calendar refreshed');
      } catch (error) {
        console.error('Error refreshing calendar:', error);
        toast.error('Failed to refresh calendar');
      } finally {
        refreshInProgressRef.current = false;
        refreshTimeoutRef.current = null;
      }
    }, 300); // Debounce time
  };

  // Cleanup the timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const handleDateChange = (date: Date) => {
    console.log('Date changed in main CalendarView component:', date);
    setCurrentViewDate(date);
    
    // Don't call refreshCalendar here as it will be triggered by the effect in useCalendarBookings
  };

  // Enhanced event drop handler that refreshes the calendar
  const handleEnhancedEventDrop = (event, newStart, newEnd) => {
    console.log('Event drop detected:', { 
      eventId: event.id, 
      newStart: newStart.toISOString(), 
      newEnd: newEnd.toISOString() 
    });
    
    handleEventDrop(event, newStart, newEnd);
    // The refresh will be triggered by the database change via the Supabase subscription
  };

  // Enhanced barber filter handler
  const handleBarberFilter = (barberId: string | null) => {
    console.log('Barber filter changed to:', barberId);
    setSelectedBarberId(barberId);
    // No explicit refresh here, the useEffect in useCalendarBookings will handle this
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
    console.log('Updating booking:', bookingId, updates);
    // Call the original updateBooking function which returns a Promise<boolean>
    return await updateBooking(bookingId, updates);
    
    // No explicit refresh call here - the Supabase subscription will trigger a refresh
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
              events={calendarEvents || []}
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
