
import React from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { CalendarViewComponent } from '@/components/admin/calendar/CalendarViewComponent';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { EventDetailsDialog } from '@/components/admin/calendar/EventDetailsDialog';
import { CalendarSettingsProvider } from '@/context/CalendarSettingsContext';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';
import { BarberFilter } from '@/components/admin/calendar/BarberFilter';

const CalendarView: React.FC = () => {
  const {
    calendarEvents,
    isLoading,
    handleEventDrop,
    handleEventClick,
    updateBooking,
    deleteBooking,
    selectedEvent,
    setSelectedEvent,
    isDialogOpen,
    setIsDialogOpen,
    selectedBarberId,
    setSelectedBarberId
  } = useCalendarBookings();
  
  return (
    <Layout>
      <AdminLayout>
        <CalendarSettingsProvider>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-3xl font-bold">Calendar</h1>
              <BarberFilter 
                selectedBarberId={selectedBarberId}
                onBarberSelect={setSelectedBarberId} 
              />
            </div>
            
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
              onDeleteBooking={deleteBooking}
            />
          </div>
        </CalendarSettingsProvider>
      </AdminLayout>
    </Layout>
  );
};

export default CalendarView;
