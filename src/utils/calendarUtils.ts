
import { format, isSameDay } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { Booking, LunchBreak } from '@/supabase-types';

// Function to get color based on booking status
export const getEventColor = (status: string): string => {
  switch (status) {
    case 'confirmed':
      return 'rgba(34, 197, 94, 0.2)'; // green
    case 'pending':
      return 'rgba(234, 179, 8, 0.2)';  // yellow
    case 'canceled':
      return 'rgba(239, 68, 68, 0.2)';  // red
    case 'completed':
      return 'rgba(59, 130, 246, 0.2)'; // blue
    case 'no-show':
      return 'rgba(124, 58, 237, 0.2)'; // purple
    case 'holiday':
      return 'rgba(249, 115, 22, 0.2)'; // orange
    default:
      return 'rgba(75, 85, 99, 0.2)';   // gray
  }
};

// Function to get color based on barber ID
export const getBarberColor = (barberId: string, isLighter: boolean = false): string => {
  // Check if the barberId is a valid UUID
  const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(barberId);
  
  // Array of distinct colors
  const defaultColors = [
    'rgba(239, 68, 68, 0.7)',   // red
    'rgba(34, 197, 94, 0.7)',   // green
    'rgba(59, 130, 246, 0.7)',  // blue
    'rgba(249, 115, 22, 0.7)',  // orange
    'rgba(124, 58, 237, 0.7)',  // purple
    'rgba(236, 72, 153, 0.7)',  // pink
    'rgba(234, 179, 8, 0.7)'    // yellow
  ];
  
  // Get a persistent color based on barberId
  let colorIndex = 0;
  if (isValidUUID) {
    // Use the first few characters of the UUID to generate a number
    const numericValue = parseInt(barberId.replace(/-/g, '').substring(0, 6), 16);
    colorIndex = numericValue % defaultColors.length;
  } else {
    // Fallback for non-UUID ids
    let hash = 0;
    for (let i = 0; i < barberId.length; i++) {
      hash = barberId.charCodeAt(i) + ((hash << 5) - hash);
    }
    colorIndex = Math.abs(hash) % defaultColors.length;
  }
  
  // Return a lighter version if requested
  if (isLighter) {
    const baseColor = defaultColors[colorIndex];
    // Convert RGBA to a lighter version by reducing opacity
    return baseColor.replace(/[\d.]+\)$/, '0.4)');
  }
  
  return defaultColors[colorIndex];
};

// Convert a booking to a calendar event
export const bookingToCalendarEvent = (booking: Booking): CalendarEvent => {
  if (!booking.booking_date || !booking.booking_time) {
    throw new Error('Booking missing date or time');
  }
  
  const [hours, minutes] = booking.booking_time.split(':').map(Number);
  const start = new Date(booking.booking_date);
  start.setHours(hours, minutes, 0, 0);
  
  // Calculate end time using service duration or default to 1 hour
  const duration = booking.service?.duration || 60;
  const end = new Date(start.getTime() + duration * 60 * 1000);
  
  return {
    id: booking.id,
    title: booking.guest_name || 'Unknown',
    start,
    end,
    barber: booking.barber?.name || 'Unassigned',
    barberId: booking.barber_id,
    service: booking.service?.name || 'Service',
    serviceId: booking.service_id,
    status: booking.status,
    notes: booking.notes || '',
    isGuest: booking.guest_booking || false,
    userId: booking.user_id || '',
    resourceId: booking.barber_id // For resource view (per barber rows)
  };
};

// Create a lunch break event
export const createLunchBreakEvent = (lunchBreak: LunchBreak): CalendarEvent => {
  // Get the barber details
  const barberName = lunchBreak.barber?.name || 'Staff';
  const barberId = lunchBreak.barber_id;
  
  // Create a date for today
  const today = new Date();
  const [startHour, startMinute] = lunchBreak.start_time.split(':').map(Number);
  const [endHour, endMinute] = lunchBreak.end_time.split(':').map(Number);
  
  // Create start and end dates for the lunch break
  const start = new Date(today);
  start.setHours(startHour, startMinute, 0, 0);
  
  const end = new Date(today);
  end.setHours(endHour, endMinute, 0, 0);
  
  return {
    id: `lunch-${lunchBreak.id}`,
    title: `Lunch (${lunchBreak.start_time}-${lunchBreak.end_time})`,
    start,
    end,
    barber: barberName,
    barberId,
    service: 'Lunch Break',
    serviceId: '',
    status: 'lunch-break',
    notes: 'Lunch break - not available for booking',
    isGuest: false,
    userId: '',
    resourceId: barberId
  };
};

// Filter events by date
export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  return events.filter(event => {
    // For lunch breaks, show them every day
    if (event.status === 'lunch-break') {
      const eventDate = new Date(event.start);
      eventDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      
      const adjustedEvent = {
        ...event,
        start: eventDate,
        end: new Date(eventDate.getTime() + (event.end.getTime() - event.start.getTime()))
      };
      
      return adjustedEvent;
    }
    
    // For regular events, filter by date
    return isSameDay(event.start, date);
  });
};

// Format date for booking database
export const formatNewBookingDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Format time for booking database
export const formatNewBookingTime = (date: Date): string => {
  return format(date, 'HH:mm');
};
