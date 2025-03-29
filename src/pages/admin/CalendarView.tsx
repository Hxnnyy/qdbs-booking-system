import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  const refreshCalendar = useCallback(() => {
    if (refreshInProgressRef.current || refreshTimeoutRef.current) {
      console.log('Refresh already in progress or scheduled, skipping');
      return;
    }
    
    console.log('Scheduling controlled calendar refresh');
    refreshInProgressRef.current = true;
    
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
    }, 300);
  }, [fetchBookings]);

  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, []);

  const handleDateChange = useCallback((date: Date) => {
    console.log('Date changed in main CalendarView component:', date);
    setCurrentViewDate(date);
  }, [setCurrentViewDate]);

  const handleEnhancedEventDrop = useCallback((event, newStart, newEnd) => {
    console.log('Event drop detected:', { 
      eventId: event.id, 
      newStart: newStart.toISOString(), 
      newEnd: newEnd.toISOString() 
    });
    
    handleEventDrop(event, newStart, newEnd);
  }, [handleEventDrop]);

  const handleBarberFilter = useCallback((barberId: string | null) => {
    console.log('Barber filter changed to:', barberId);
    setSelectedBarberId(barberId);
  }, [setSelectedBarberId]);

  const handleUpdateBooking = useCallback(async (bookingId: string, updates: { 
    title?: string; 
    barber_id?: string; 
    service_id?: string; 
    notes?: string;
    booking_date?: string;
    booking_time?: string;
    status?: string;
  }): Promise<boolean> => {
    console.log('Updating booking:', bookingId, updates);
    const result = await updateBooking(bookingId, updates);
    return result.success;
  }, [updateBooking]);

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
