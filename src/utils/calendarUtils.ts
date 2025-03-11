import { format, parseISO, addMinutes, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { Booking, LunchBreak } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';
import { supabase } from '@/integrations/supabase/client';

// Convert a booking to a calendar event
export const bookingToCalendarEvent = (booking: Booking): CalendarEvent => {
  try {
    // Special handling for holiday bookings
    if (booking.status === 'holiday') {
      return createHolidayEvent(booking);
    }
    
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

// Create a calendar event for a holiday
export const createHolidayEvent = (booking: Booking): CalendarEvent => {
  try {
    // Parse date and create a full-day event
    const dateStr = booking.booking_date;
    
    if (!dateStr) {
      console.error('Missing date in holiday booking:', booking);
      throw new Error('Missing date in holiday booking');
    }
    
    // Create a date object for the start of the day
    const startDate = parseISO(`${dateStr}T00:00:00`);
    
    // End at the end of the day
    const endDate = parseISO(`${dateStr}T23:59:59`);
    
    return {
      id: booking.id,
      title: 'Holiday',
      start: startDate,
      end: endDate,
      barber: booking.barber?.name || 'Unknown',
      barberId: booking.barber_id,
      service: 'Holiday',
      serviceId: booking.service_id,
      status: 'holiday',
      isGuest: false,
      notes: booking.notes || 'Barber holiday',
      userId: booking.user_id,
      resourceId: booking.barber_id,
    };
  } catch (error) {
    console.error('Error creating holiday event:', error, booking);
    // Return a fallback event to prevent crashes
    return {
      id: booking.id,
      title: 'Holiday (Error)',
      start: new Date(),
      end: addMinutes(new Date(), 24 * 60), // Full day
      barber: 'Unknown',
      barberId: booking.barber_id,
      service: 'Holiday',
      serviceId: booking.service_id,
      status: 'holiday',
      isGuest: false,
      notes: 'Error parsing holiday data',
      userId: booking.user_id,
      resourceId: booking.barber_id,
    };
  }
};

// Create a calendar event for a lunch break
export const createLunchBreakEvent = (lunchBreak: LunchBreak & { barber?: { name: string } }): CalendarEvent => {
  try {
    // Create a lunch break event for today
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

// Generate a color based on barber ID for consistency
export const getBarberColor = async (barberId: string, returnRGB: boolean = false): Promise<string> => {
  // If no barberId is provided, return a default color
  if (!barberId) {
    return returnRGB ? '155, 135, 245' : '#9b87f5';
  }

  // Fetch the barber's custom color from the database
  const { data: barber } = await supabase
    .from('barbers')
    .select('color')
    .eq('id', barberId)
    .single();

  if (barber?.color) {
    if (returnRGB) {
      // Convert hex to RGB
      const hex = barber.color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      return `${r}, ${g}, ${b}`;
    }
    return barber.color;
  }

  // Fallback to generated color if no custom color is set
  const hash = Array.from(barberId).reduce(
    (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0
  );
  const hue = Math.abs(hash) % 360;
  
  if (returnRGB) {
    // Convert HSL to RGB for better control of transparency
    const h = hue / 360;
    const s = 0.7; // 70% saturation as a number
    const l = 0.6; // 60% lightness as a number
    
    let r, g, b;
    
    if (s === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      
      r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
      g = Math.round(hue2rgb(p, q, h) * 255);
      b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
    }
    
    return `${r}, ${g}, ${b}`;
  }
  
  return `hsl(${hue}, 70%, 60%)`;
};

// Get a color for a specific event type
export const getEventColor = async (event: CalendarEvent): Promise<string> => {
  // For holidays, use a distinct color pattern
  if (event.status === 'holiday') {
    const baseColor = await getBarberColor(event.barberId, true);
    return `repeating-linear-gradient(45deg, rgba(${baseColor}, 0.2), rgba(${baseColor}, 0.2) 10px, rgba(${baseColor}, 0.3) 10px, rgba(${baseColor}, 0.3) 20px)`;
  }
  
  // For lunch breaks, use barber-specific colors
  if (event.status === 'lunch-break') {
    const barberColor = await getBarberColor(event.barberId, true);
    return `rgba(${barberColor}, 0.2)`;
  }
  
  // For regular bookings, use barber-based colors
  return await getBarberColor(event.barberId);
};

// Filter events for calendar view based on date
export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  // Create lunch break events for this specific date
  const eventsForDate = events.map(event => {
    // If it's a lunch break, adjust the date to match the target date
    if (event.status === 'lunch-break') {
      const newStart = new Date(date);
      newStart.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0);
      
      const newEnd = new Date(date);
      newEnd.setHours(event.end.getHours(), event.end.getMinutes(), 0, 0);
      
      return {
        ...event,
        start: newStart,
        end: newEnd
      };
    }
    
    return event;
  });
  
  return eventsForDate.filter(event => isSameDay(event.start, date));
};

// Filter events for a week view
export const filterEventsByWeek = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Week starts on Monday
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });
  
  // Create lunch break events for each day of the week
  const allEvents: CalendarEvent[] = [];
  
  events.forEach(event => {
    if (event.status === 'lunch-break') {
      // For lunch breaks, create an event for each day of the week
      for (let day = 0; day < 7; day++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(weekStart.getDate() + day);
        
        const newStart = new Date(dayDate);
        newStart.setHours(event.start.getHours(), event.start.getMinutes(), 0, 0);
        
        const newEnd = new Date(dayDate);
        newEnd.setHours(event.end.getHours(), event.end.getMinutes(), 0, 0);
        
        allEvents.push({
          ...event,
          id: `${event.id}-${day}`, // Make ID unique for each day
          start: newStart,
          end: newEnd
        });
      }
    } else {
      // Regular bookings
      allEvents.push(event);
    }
  });
  
  return allEvents.filter(event => {
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
