
import React from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { Calendar } from '@/components/admin/calendar/Calendar';
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
        <div className="space-y-4 flex flex-col h-[calc(100vh-120px)]">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Calendar</h1>
          </div>
          
          <div className="flex-1 overflow-hidden border border-border rounded-md">
            <Calendar
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
