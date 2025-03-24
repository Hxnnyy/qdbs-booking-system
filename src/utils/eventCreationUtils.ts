
import { format, parseISO } from 'date-fns';
import { CalendarEvent } from '@/types/calendar';
import { Booking } from '@/supabase-types';
import { getEventColor } from './eventColorUtils';

/**
 * Convert a booking to a calendar event
 */
export const bookingToCalendarEvent = (booking: Booking): CalendarEvent => {
  const serviceTitle = booking.service?.name || 'Unknown Service';
  const clientName = getClientName(booking);

  // Format the title with client name if available
  const title = clientName ? `${serviceTitle} - ${clientName}` : serviceTitle;

  try {
    const date = parseISO(booking.booking_date);
    const [hours, minutes] = booking.booking_time.split(':').map(Number);
    
    // Set the time on the date
    date.setHours(hours, minutes);
    
    // Duration defaults to 30 minutes if not specified
    const duration = booking.service?.duration || 30;
    
    // Create end date by adding duration
    const endDate = new Date(date);
    endDate.setMinutes(endDate.getMinutes() + duration);
    
    // Format dates for display
    const formattedTime = format(date, 'h:mm a');
    const formattedDate = format(date, 'EEEE, MMMM d');
    
    // Status for the calendar
    let status: "confirmed" | "cancelled" | "completed" | "lunch-break" | "holiday" | "error" = "confirmed";
    if (booking.status === 'confirmed') status = "confirmed";
    else if (booking.status === 'cancelled') status = "cancelled";
    else if (booking.status === 'completed') status = "completed";
    else if (booking.status === 'no-show') status = "cancelled"; // Map no-show to cancelled for display
    
    // Get color based on status
    const color = getEventColor(status);
    
    return {
      id: booking.id,
      title,
      start: date,
      end: endDate,
      status,
      color,
      barberId: booking.barber_id,
      barberName: booking.barber?.name || 'Unknown Barber',
      barberColor: booking.barber?.color,
      clientName,
      bookingTime: formattedTime,
      bookingDate: formattedDate,
      notes: booking.notes || '',
      serviceId: booking.service_id,
      serviceName: serviceTitle,
      serviceDuration: duration,
      servicePrice: booking.service?.price || 0,
      isUserBooking: !booking.guest_booking,
      isGuestBooking: booking.guest_booking === true
    };
  } catch (error) {
    console.error('Error converting booking to calendar event:', error);
    
    return {
      id: booking.id,
      title: `Error: ${title}`,
      start: new Date(),
      end: new Date(),
      status: "error",
      color: "#ff0000",
      barberId: booking.barber_id,
      notes: `Error processing booking: ${error}`,
      isUserBooking: !booking.guest_booking,
      isGuestBooking: booking.guest_booking === true
    };
  }
};

/**
 * Helper to extract client name from booking
 */
const getClientName = (booking: Booking): string => {
  if (booking.guest_booking === true) {
    // For guest bookings, try to extract from notes
    if (booking.notes) {
      const nameMatch = booking.notes.match(/Guest booking by (.+?) \(/);
      if (nameMatch) return nameMatch[1];
    }
    return 'Guest';
  } 
  
  if (booking.profile) {
    // For registered users, use profile info
    if (booking.profile.first_name || booking.profile.last_name) {
      return `${booking.profile.first_name || ''} ${booking.profile.last_name || ''}`.trim();
    }
    
    // If no name but email exists
    if (booking.profile.email) {
      return booking.profile.email.split('@')[0];
    }
  }
  
  return 'Client';
};
