
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
        <div className="space-y-4 h-[calc(100vh-120px)] flex flex-col">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Calendar</h1>
          </div>
          
          {/* Calendar container - set to full height minus header */}
          <div className="flex-1 rounded-md border border-border overflow-hidden">
            <CalendarViewComponent
              events={calendarEvents}
              isLoading={isLoading}
              onEventDrop={handleEventDrop}
              onEventClick={handleEventClick}
            />
          </div>
          
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
