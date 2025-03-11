
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { AdminLayout } from '@/components/AdminLayout';
import { CalendarViewComponent } from '@/components/admin/calendar/CalendarViewComponent';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { EventDetailsDialog } from '@/components/admin/calendar/EventDetailsDialog';
import { BarberFilter } from '@/components/admin/calendar/BarberFilter';
import { CalendarContext } from '@/context/CalendarSettingsContext';
import { useCalendarSettings } from '@/hooks/useCalendarSettings';

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
  
  const calendarSettings = useCalendarSettings();
  
  return (
    <Layout>
      <AdminLayout>
        <CalendarContext.Provider value={calendarSettings}>
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h1 className="text-3xl font-bold">Calendar</h1>
              <BarferFilter 
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
        </CalendarContext.Provider>
      </AdminLayout>
    </Layout>
  );
};

export default CalendarView;
