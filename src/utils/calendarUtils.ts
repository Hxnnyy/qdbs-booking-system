
import { format, parseISO, addMinutes, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { Booking } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';

// Convert a booking to a calendar event
export const bookingToCalendarEvent = (booking: Booking): CalendarEvent => {
  try {
    // Parse date and time properly
    const dateStr = booking.booking_date;
    const timeStr = booking.booking_time;
    
    // Ensure we have both date and time
    if (!dateStr || !timeStr) {
      console.error('Missing date or time in booking:', booking);
      throw new Error('Missing date or time in booking');
    }
    
    // Create ISO string and parse it
    const startDateStr = `${dateStr}T${timeStr}`;
    const startDate = parseISO(startDateStr);
    
    // Check if parsing was successful
    if (isNaN(startDate.getTime())) {
      console.error('Invalid date or time format:', startDateStr);
      throw new Error('Invalid date or time format');
    }
    
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
  } catch (error) {
    console.error('Error converting booking to calendar event:', error, booking);
    // Return a fallback event to prevent crashes
    return {
      id: booking.id,
      title: 'Invalid Booking',
      start: new Date(),
      end: addMinutes(new Date(), 30),
      barber: 'Unknown',
      barberId: booking.barber_id,
      service: 'Unknown',
      serviceId: booking.service_id,
      status: 'error',
      isGuest: false,
      notes: 'Error parsing booking data',
      userId: booking.user_id,
      resourceId: booking.barber_id,
    };
  }
};

// Define default barber colors mapping - fixed to match requirements
const barberDefaultColors: Record<string, string> = {
  // Default colors for specific barbers by name
  'Chris': '#0EA5E9', // Blue
  'Thomas': '#4ade80', // Green
  'Conor': '#facc15', // Yellow
};

// Store custom barber colors (will be loaded from database in the future)
let customBarberColors: Record<string, string> = {};

// Set a custom color for a barber
export const setBarberColor = (barberId: string, color: string): void => {
  customBarberColors[barberId] = color;
};

// Generate a color based on barber ID or name
export const getBarberColor = (barberId: string, barberName?: string): string => {
  // First check if there's a custom color set for this barber
  if (customBarberColors[barberId]) {
    return customBarberColors[barberId];
  }
  
  // Then check if there's a default color by name
  if (barberName && barberDefaultColors[barberName]) {
    return barberDefaultColors[barberName];
  }
  
  // Otherwise, calculate a color from the barber ID
  const hash = Array.from(barberId).reduce(
    (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0
  );
  const hue = Math.abs(hash) % 360;
  
  return `hsl(${hue}, 70%, 60%)`;
};

// Filter events for calendar view based on date
export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  return events.filter(event => 
    isSameDay(event.start, date) && event.status !== 'cancelled'
  );
};

// Filter events for a week view
export const filterEventsByWeek = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Week starts on Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  return events.filter(event => {
    const eventDate = event.start;
    return eventDate >= weekStart && eventDate <= weekEnd && event.status !== 'cancelled';
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

// Get color based on booking status
export const getStatusColor = (status: string): string => {
  switch(status) {
    case 'confirmed': return 'blue';
    case 'completed': return 'green';
    case 'cancelled': return 'red';
    case 'no-show': return 'amber';
    default: return 'gray';
  }
};
