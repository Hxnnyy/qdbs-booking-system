
import { format, parseISO, addMinutes, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { Booking } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';

// Convert a booking to a calendar event
export const bookingToCalendarEvent = (booking: Booking): CalendarEvent => {
  const startDate = parseISO(`${booking.booking_date}T${booking.booking_time}`);
  const duration = booking.service?.duration || 30; // Default to 30 minutes if no duration
  const endDate = addMinutes(startDate, duration);
  
  // Extract guest name from notes if it's a guest booking
  let guestName = 'Guest';
  if (booking.guest_booking && booking.notes) {
    const guestMatch = booking.notes.match(/Guest booking by ([^(]+)/);
    if (guestMatch && guestMatch[1]) {
      guestName = guestMatch[1].trim();
    }
  }
  
  return {
    id: booking.id,
    title: booking.guest_booking 
      ? `Guest: ${guestName}`
      : `Client Booking`,
    start: startDate,
    end: endDate,
    barber: booking.barber?.name || 'Unknown',
    barberId: booking.barber_id,
    service: booking.service?.name || 'Unknown',
    serviceId: booking.service_id,
    status: booking.status,
    isGuest: booking.guest_booking || false,
    notes: booking.notes || '',
    userId: booking.user_id,
    resourceId: booking.barber_id, // For resource view (barber-specific rows)
  };
};

// Generate a color based on barber ID for consistency
export const getBarberColor = (barberId: string): string => {
  // Simple hash function to generate a hue value (0-360)
  const hash = Array.from(barberId).reduce(
    (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0
  );
  const hue = Math.abs(hash) % 360;
  
  return `hsl(${hue}, 70%, 60%)`;
};

// Filter events for calendar view based on date
export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  return events.filter(event => isSameDay(event.start, date));
};

// Filter events for a week view
export const filterEventsByWeek = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Week starts on Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  return events.filter(event => {
    const eventDate = event.start;
    return eventDate >= weekStart && eventDate <= weekEnd;
  });
};

// Update booking time based on drag-and-drop
export const formatNewBookingTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

// Update booking date based on drag-and-drop
export const formatNewBookingDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};
