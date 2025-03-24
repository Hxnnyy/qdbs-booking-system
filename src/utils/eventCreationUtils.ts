
import { format, parseISO, addMinutes } from 'date-fns';
import { Booking, LunchBreak } from '@/supabase-types';
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
      barberColor: booking.barber?.color, // Add barber color to event
      service: booking.service?.name || 'Unknown',
      serviceId: booking.service_id,
      status: booking.status as 'confirmed' | 'cancelled' | 'completed' | 'lunch-break' | 'holiday',
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
      status: 'error' as 'confirmed' | 'cancelled' | 'completed' | 'lunch-break' | 'holiday' | 'error',
      isGuest: false,
      notes: 'Error parsing booking data',
      userId: booking.user_id,
      resourceId: booking.barber_id,
    };
  }
};

// Create a calendar event for a lunch break
export const createLunchBreakEvent = (lunchBreak: LunchBreak & { barber?: { name: string, color?: string } }): CalendarEvent => {
  try {
    // Create a lunch break event for today - this will be adjusted for each day of the week
    // when displayed in the calendar views
    const today = new Date();
    const [hours, minutes] = lunchBreak.start_time.split(':').map(Number);
    
    const startDate = new Date(today);
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = addMinutes(startDate, lunchBreak.duration);
    
    return {
      id: `lunch-${lunchBreak.id}`, // Prefix with "lunch-" to distinguish from regular bookings
      title: `Lunch Break (${lunchBreak.duration} mins)`,
      start: startDate,
      end: endDate,
      barber: lunchBreak.barber?.name || 'Unknown',
      barberId: lunchBreak.barber_id,
      barberColor: lunchBreak.barber?.color, // Use the barber's color for lunch breaks
      service: 'Lunch Break',
      serviceId: '', // No service ID for lunch breaks
      status: 'lunch-break',
      isGuest: false,
      notes: `Daily lunch break for ${lunchBreak.barber?.name || 'barber'}`,
      userId: '', // No user ID for lunch breaks
      resourceId: lunchBreak.barber_id,
    };
  } catch (error) {
    console.error('Error creating lunch break event:', error, lunchBreak);
    // Return a fallback event to prevent crashes
    return {
      id: `lunch-error-${Date.now()}`,
      title: 'Invalid Lunch Break',
      start: new Date(),
      end: addMinutes(new Date(), 30),
      barber: 'Unknown',
      barberId: lunchBreak.barber_id,
      service: 'Lunch Break',
      serviceId: '',
      status: 'lunch-break',
      isGuest: false,
      notes: 'Error parsing lunch break data',
      userId: '',
      resourceId: lunchBreak.barber_id,
    };
  }
};

// Create a holiday event for the calendar
export const createHolidayEvent = (holiday: any, barber: { name: string, color?: string }): CalendarEvent => {
  try {
    const startDate = new Date(holiday.start_date);
    const endDate = new Date(holiday.end_date);
    
    // Set time to 00:00:00 for the start date
    startDate.setHours(0, 0, 0, 0);
    
    // Set time to 23:59:59 for the end date to cover the whole day
    endDate.setHours(23, 59, 59, 999);
    
    return {
      id: `holiday-${holiday.id}`,
      title: `Holiday${holiday.reason ? `: ${holiday.reason}` : ''}`,
      start: startDate,
      end: endDate,
      barber: barber.name || 'Unknown',
      barberId: holiday.barber_id,
      barberColor: barber.color,
      service: 'Holiday',
      serviceId: '',
      status: 'holiday',
      isGuest: false,
      notes: holiday.reason || 'Barber Holiday',
      userId: '',
      resourceId: holiday.barber_id,
      allDay: true
    };
  } catch (error) {
    console.error('Error creating holiday event:', error, holiday);
    // Return a fallback event to prevent crashes
    return {
      id: `holiday-error-${Date.now()}`,
      title: 'Invalid Holiday',
      start: new Date(),
      end: addMinutes(new Date(), 30),
      barber: 'Unknown',
      barberId: holiday.barber_id,
      service: 'Holiday',
      serviceId: '',
      status: 'holiday',
      isGuest: false,
      notes: 'Error parsing holiday data',
      userId: '',
      resourceId: holiday.barber_id,
      allDay: true
    };
  }
};
