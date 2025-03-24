
import { format, parseISO, addMinutes } from 'date-fns';
import { Booking } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';

// Extract guest info from notes field
const extractGuestInfo = (notes: string | null) => {
  if (!notes) return { name: 'Unknown', phone: 'Unknown', code: 'Unknown' };
  
  const nameMatch = notes.match(/Guest booking by (.+?) \(/);
  const phoneMatch = notes.match(/\((.+?)\)/);
  const codeMatch = notes.match(/Verification code: (\d+)/);
  
  return {
    name: nameMatch ? nameMatch[1] : 'Unknown',
    phone: phoneMatch ? phoneMatch[1] : 'Unknown',
    code: codeMatch ? codeMatch[1] : 'Unknown'
  };
};

/**
 * Converts a booking record to a calendar event format
 */
export const bookingToCalendarEvent = (booking: Booking): CalendarEvent => {
  // Parse booking date and time
  const bookingDateTime = parseISO(`${booking.booking_date}T${booking.booking_time}`);
  
  // Calculate event end time based on service duration
  const duration = booking.service?.duration || 30; // default to 30 minutes if duration is missing
  const endDateTime = addMinutes(bookingDateTime, duration);
  
  // Determine title based on whether it's a guest booking or user booking
  let title = 'Unknown Client';
  
  if (booking.guest_booking && booking.notes) {
    // Extract guest name from notes
    const guestInfo = extractGuestInfo(booking.notes);
    title = `Guest: ${guestInfo.name}`;
  } else if (booking.profile) {
    // For registered users with profile
    const { first_name, last_name, email } = booking.profile;
    
    if (first_name || last_name) {
      title = `${first_name || ''} ${last_name || ''}`.trim();
    } else if (email) {
      // Use email username as fallback
      title = email.split('@')[0];
    }
  }
  
  // Create and return the calendar event object
  return {
    id: booking.id,
    title,
    start: bookingDateTime,
    end: endDateTime,
    resourceId: booking.barber_id,
    status: booking.status as "confirmed" | "cancelled" | "completed" | "error",
    notes: booking.notes || undefined,
    barberId: booking.barber_id,
    barberName: booking.barber?.name || 'Unknown Barber',
    serviceId: booking.service_id,
    service: booking.service?.name || 'Unknown Service',
    isGuest: booking.guest_booking || false,
    userId: booking.user_id,
    allDay: false
  };
};

/**
 * Creates a calendar event for a lunch break
 */
export const createLunchBreakEvent = (lunchBreak: any): CalendarEvent => {
  // Parse lunch break time
  const today = new Date();
  const formattedDate = format(today, 'yyyy-MM-dd');
  
  const startDateTime = parseISO(`${formattedDate}T${lunchBreak.start_time}`);
  const endDateTime = addMinutes(startDateTime, lunchBreak.duration);
  
  // Create a unique ID for the lunch break
  const lunchBreakId = `lunch-${lunchBreak.barber_id}`;
  
  return {
    id: lunchBreakId,
    title: 'Lunch Break',
    start: startDateTime,
    end: endDateTime,
    barberId: lunchBreak.barber_id,
    barberName: lunchBreak.barber?.name || 'Unknown Barber',
    barberColor: lunchBreak.barber?.color,
    service: 'Lunch Break',
    serviceId: 'lunch',
    status: 'lunch-break',
    isGuest: false,
    notes: 'Barber lunch break - not available for bookings',
    userId: '',
    resourceId: lunchBreak.barber_id,
    allDay: false
  };
};

/**
 * Creates a calendar event for a holiday
 */
export const createHolidayEvent = (holiday: any, barber: any): CalendarEvent => {
  // Parse holiday dates
  const startDate = parseISO(holiday.start_date);
  const endDate = parseISO(holiday.end_date);
  
  // Create a unique ID for the holiday
  const holidayId = `holiday-${holiday.id}`;
  
  return {
    id: holidayId,
    title: holiday.title || 'Holiday',
    start: startDate,
    end: endDate,
    barberId: holiday.barber_id,
    barberName: barber?.name || 'Unknown Barber',
    barberColor: barber?.color,
    service: 'Holiday',
    serviceId: 'holiday',
    status: 'holiday',
    isGuest: false,
    notes: holiday.notes || 'Barber unavailable - holiday',
    userId: '',
    resourceId: holiday.barber_id,
    allDay: true
  };
};
