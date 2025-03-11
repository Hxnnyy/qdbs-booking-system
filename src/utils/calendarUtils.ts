
import { format, parseISO, addMinutes, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { Booking, LunchBreak } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';
import { supabase } from '@/integrations/supabase/client';

// Barber color cache to reduce database queries
let barberColorsCache: Record<string, string | null> = {};

// Function to get barber color from the database or cache
const getBarberColorFromDb = async (barberId: string): Promise<string | null> => {
  // Return from cache if available
  if (barberColorsCache[barberId] !== undefined) {
    return barberColorsCache[barberId];
  }
  
  try {
    // @ts-ignore - Supabase types issue
    const { data, error } = await supabase
      .from('barbers')
      .select('color')
      .eq('id', barberId)
      .single();
    
    if (error) {
      console.error('Error fetching barber color:', error);
      return null;
    }
    
    const color = data?.color || null;
    // Update cache
    barberColorsCache[barberId] = color;
    return color;
  } catch (error) {
    console.error('Error getting barber color:', error);
    return null;
  }
};

// Clear cache function (can be called when barber colors are updated)
export const clearBarberColorCache = () => {
  barberColorsCache = {};
};

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

// Generate a color based on barber ID for consistency
export const getBarberColor = (barberId: string, returnRGB: boolean = false): string => {
  // Try to get the color from cache first
  const cachedColor = barberColorsCache[barberId];
  
  if (cachedColor) {
    if (returnRGB) {
      // Convert hex to RGB
      const r = parseInt(cachedColor.slice(1, 3), 16);
      const g = parseInt(cachedColor.slice(3, 5), 16);
      const b = parseInt(cachedColor.slice(5, 7), 16);
      return `${r}, ${g}, ${b}`;
    }
    return cachedColor;
  }
  
  // If no cached color, use the hash-based fallback
  const hash = Array.from(barberId).reduce(
    (acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0
  );
  const hue = Math.abs(hash) % 360;
  
  const saturation = returnRGB ? '85' : '70';
  const lightness = returnRGB ? '40' : '60';
  
  if (returnRGB) {
    // Convert HSL to RGB for better control of transparency
    const h = hue / 360;
    const s = parseInt(saturation) / 100;
    const l = parseInt(lightness) / 100;
    
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
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Get a color for a specific event type
export const getEventColor = (event: CalendarEvent): string => {
  // For holiday events, use a distinct color
  if (event.status === 'holiday') {
    return 'rgba(255, 0, 0, 0.3)'; // Semi-transparent red for holidays
  }
  
  // For lunch breaks, use barber-specific colors with transparency
  if (event.status === 'lunch-break') {
    // If the event has a barberColor property, use that with transparency
    if (event.barberColor) {
      // Convert hex to RGB if it's a hex color
      if (event.barberColor.startsWith('#')) {
        const r = parseInt(event.barberColor.slice(1, 3), 16);
        const g = parseInt(event.barberColor.slice(3, 5), 16);
        const b = parseInt(event.barberColor.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, 0.5)`;
      }
      return `${event.barberColor.replace(')', ', 0.5)')}`;
    }
    return `rgba(${getBarberColor(event.barberId, true)}, 0.5)`;
  }
  
  // If the event has a barberColor property, use that
  if (event.barberColor) {
    return event.barberColor;
  }
  
  // Otherwise, fall back to the generated color
  return getBarberColor(event.barberId);
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

// Check if a date falls within a barber's holiday period
export const isBarberOnHoliday = async (barberId: string, date: Date): Promise<boolean> => {
  try {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('barber_holidays')
      .select('*')
      .eq('barber_id', barberId)
      .lte('start_date', formattedDate)
      .gte('end_date', formattedDate);
    
    if (error) {
      console.error('Error checking barber holiday:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('Error in isBarberOnHoliday:', error);
    return false;
  }
};
