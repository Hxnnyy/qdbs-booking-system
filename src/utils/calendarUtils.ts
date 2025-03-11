
import { format, addMinutes, isWithinInterval, isSameDay } from 'date-fns';
import { Booking, LunchBreak } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';

export const bookingToCalendarEvent = (booking: Booking): CalendarEvent => {
  if (!booking.barber || !booking.service) {
    console.error('Missing barber or service in booking:', booking);
    throw new Error('Missing barber or service in booking');
  }

  const start = new Date(`${booking.booking_date}T${booking.booking_time}`);
  const end = addMinutes(start, booking.service.duration);

  return {
    id: booking.id,
    title: booking.service.name,
    start,
    end,
    barber: booking.barber.name,
    service: booking.service.name,
    barberId: booking.barber_id,
    serviceId: booking.service_id,
    status: booking.status,
    notes: booking.notes || '',
    isGuest: booking.guest_booking || false,
    userId: booking.user_id || '',
    resourceId: booking.barber_id // Using barber_id as resourceId for resource view
  };
};

export const createLunchBreakEvent = (lunchBreak: LunchBreak): CalendarEvent => {
  // Fixing the lunch break events to work across days
  // Instead of using current date, we need to use the date from the calendar
  // The date will be applied dynamically in the calendar components
  return {
    id: `lunch-${lunchBreak.id}`,
    title: 'Lunch Break',
    start: new Date(`2000-01-01T${lunchBreak.start_time}`), // Using a fixed date - actual date will be set in the calendar
    end: new Date(`2000-01-01T${lunchBreak.start_time}`), // End time will be calculated in the calendar components
    barber: lunchBreak.barber ? lunchBreak.barber.name : 'Barber',
    service: 'Lunch',
    barberId: lunchBreak.barber_id,
    serviceId: 'lunch',
    status: 'lunch-break',
    notes: 'Lunch Break',
    isGuest: false,
    userId: '',
    resourceId: lunchBreak.barber_id,
    duration: lunchBreak.duration // Adding duration property to use in the calendar components
  };
};

export const formatNewBookingDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatNewBookingTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

export const isTimeWithinRange = (time: Date, openTime: string, closeTime: string): boolean => {
  const [openHour, openMinute] = openTime.split(':').map(Number);
  const [closeHour, closeMinute] = closeTime.split(':').map(Number);

  const now = new Date();
  const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), openHour, openMinute, 0);
  const endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), closeHour, closeMinute, 0);

  return isWithinInterval(time, { start: startTime, end: endTime });
};

// Fix the getBarberColor function - it was previously returning rgba values incorrectly
export const getBarberColor = (barberId: string, isLunch = false): string => {
  // Storage keys for the barber colors
  const BARBER_COLORS_KEY = 'barberColors';
  
  // Default colors
  const defaultColors = {
    red: 128,
    green: 128,
    blue: 128,
    opacity: isLunch ? 0.5 : 0.7
  };
  
  // Try to load colors from localStorage
  const storedColors = localStorage.getItem(BARBER_COLORS_KEY);
  let barberColors = storedColors ? JSON.parse(storedColors) : {};
  
  // If color exists for this barber, return it
  if (barberColors[barberId]) {
    const color = barberColors[barberId];
    // If the color is already in rgba format, return it as is
    if (color.startsWith('rgba')) {
      return color;
    }
    // If it's a hex color, convert it to rgba
    return hexToRgba(color, defaultColors.opacity);
  } else {
    // Generate a default color
    const rgba = `rgba(${defaultColors.red}, ${defaultColors.green}, ${defaultColors.blue}, ${defaultColors.opacity})`;
    barberColors[barberId] = rgba;
    localStorage.setItem(BARBER_COLORS_KEY, JSON.stringify(barberColors));
    return rgba;
  }
};

// Utility function to convert hex to rgba
function hexToRgba(hex: string, opacity: number): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Return rgba
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export const getEventColor = (status: string, pastEvent = false): string => {
  const defaultRed = 128;
  const defaultGreen = 128;
  const defaultBlue = 128;
  const opacity = pastEvent ? 0.3 : 0.7;
  
  if (status === 'cancelled') {
    return `rgba(255, 0, 0, ${opacity})`; // Red for cancelled events
  } else if (status === 'confirmed') {
    return `rgba(0, 128, 0, ${opacity})`; // Green for confirmed events
  } else if (status === 'pending') {
    return `rgba(255, 165, 0, ${opacity})`; // Orange for pending events
  } else {
    if (opacity < 0) {
      return `rgba(${defaultRed}, ${defaultGreen}, ${defaultBlue}, 0.3)`;
    }
    
    return `rgba(${defaultRed}, ${defaultGreen}, ${defaultBlue}, ${opacity})`;
  }
};

// The filterEventsByDate function
export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  // Filter events by the provided date
  // For lunch breaks, we need to create a new event with the correct date
  return events.map(event => {
    // For lunch breaks, create a new event with the current date
    if (event.status === 'lunch-break') {
      // Create a new date object for the start time
      const start = new Date(date);
      // Set hours and minutes from the lunch break start time
      start.setHours(event.start.getHours());
      start.setMinutes(event.start.getMinutes());
      
      // Create a new date object for the end time
      const end = new Date(start);
      // Add the duration to get the end time
      end.setMinutes(end.getMinutes() + (event as any).duration);
      
      // Return a new event with the updated start and end times
      return {
        ...event,
        start,
        end
      };
    }
    
    return event;
  }).filter(event => isSameDay(event.start, date));
};
