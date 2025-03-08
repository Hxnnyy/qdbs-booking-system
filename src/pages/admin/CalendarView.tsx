
import React from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { CalendarViewComponent } from '@/components/admin/calendar/CalendarView';
import { EventDetailsDialog } from '@/components/admin/calendar/EventDetailsDialog';

const CalendarView = () => {
  const {
    calendarEvents,
    isLoading,
    handleEventDrop,
    handleEventClick,
    selectedEvent,
    setSelectedEvent,
    isDialogOpen,
    setIsDialogOpen
  } = useCalendarBookings();

  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Calendar View</h1>
          
          <p className="text-muted-foreground">
            View and manage appointments in calendar format. Drag and drop to reschedule.
          </p>
          
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
          />
        </div>
      </AdminLayout>
    </Layout>
  );
};

export default CalendarView;
