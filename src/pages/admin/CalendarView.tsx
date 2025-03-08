
import React from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { CalendarViewComponent } from '@/components/admin/calendar/CalendarView';
import { EventDetailsDialog } from '@/components/admin/calendar/EventDetailsDialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIsMobile } from '@/hooks/use-mobile';

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
  
  const isMobile = useIsMobile();

  return (
    <Layout>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Calendar</h1>
          </div>
          
          <ScrollArea className="h-[calc(100vh-200px)] rounded-md">
            <CalendarViewComponent
              events={calendarEvents}
              isLoading={isLoading}
              onEventDrop={handleEventDrop}
              onEventClick={handleEventClick}
            />
          </ScrollArea>
          
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
