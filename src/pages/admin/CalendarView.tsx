
import React from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { CalendarViewComponent } from '@/components/admin/calendar/CalendarViewComponent';
import { EventDetailsDialog } from '@/components/admin/calendar/EventDetailsDialog';
import { BarberFilter } from '@/components/admin/calendar/BarberFilter';
import { CalendarSettingsProvider } from '@/context/CalendarSettingsContext';

const CalendarView = () => {
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
    setBarberFilter
  } = useCalendarBookings();

  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Calendar View</h1>
          
          <div className="flex flex-col space-y-4">
            <p className="text-muted-foreground">
              View and manage appointments in calendar format. Drag and drop to reschedule.
            </p>
            
            <BarberFilter 
              selectedBarberId={selectedBarberId}
              onSelectBarber={setBarberFilter}
            />
          </div>
          
          <CalendarSettingsProvider>
            <CalendarViewComponent
              events={calendarEvents}
              isLoading={isLoading}
              onEventDrop={handleEventDrop}
              onEventClick={handleEventClick}
            />
            
            <EventDetailsDialog
              event={selectedEvent}
              isOpen={isDialogOpen}
              onClose={() => {
                setIsDialogOpen(false);
                setSelectedEvent(null);
              }}
              onUpdateBooking={updateBooking}
            />
          </CalendarSettingsProvider>
        </div>
      </AdminLayout>
    </Layout>
  );
};

export default CalendarView;
