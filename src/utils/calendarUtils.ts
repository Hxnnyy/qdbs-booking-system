
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
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');
  const startTime = new Date(`${today}T${lunchBreak.start_time}`);
  const endTime = addMinutes(startTime, lunchBreak.duration);
  
  return {
    id: `lunch-${lunchBreak.id}`,
    title: 'Lunch Break',
    start: startTime,
    end: endTime,
    barber: 'Barber', // This will be populated dynamically
    service: 'Lunch',
    barberId: lunchBreak.barber_id,
    serviceId: 'lunch',
    status: 'lunch-break',
    notes: 'Lunch Break',
    isGuest: false,
    userId: '',
    resourceId: lunchBreak.barber_id
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

export const getBarberColor = async (barberId: string, isLunch = false): Promise<string> => {
  const defaultRed = 128;
  const defaultGreen = 128;
  const defaultBlue = 128;
  const defaultOpacity = 0.7;
  
  const storedColors = localStorage.getItem('barberColors');
  let barberColors: { [key: string]: string } = storedColors ? JSON.parse(storedColors) : {};
  
  if (barberColors[barberId]) {
    return barberColors[barberId];
  } else {
    const newColor = `rgba(${defaultRed}, ${defaultGreen}, ${defaultBlue}, ${defaultOpacity})`;
    barberColors[barberId] = newColor;
    localStorage.setItem('barberColors', JSON.stringify(barberColors));
    return newColor;
  }
};

export const getEventColor = async (status: string, pastEvent = false): Promise<string> => {
  const defaultRed = 128;
  const defaultGreen = 128;
  const defaultBlue = 128;
  let opacity = pastEvent ? 0.3 : 0.7;
  
  if (status === 'cancelled') {
    return `rgba(255, 0, 0, ${opacity})`; // Red for cancelled events
  } else if (status === 'confirmed') {
    return `rgba(0, 128, 0, ${opacity})`; // Green for confirmed events
  } else if (status === 'pending') {
    return `rgba(255, 165, 0, ${opacity})`; // Orange for pending events
  } else {
    // Fixed by comparing opacity as a number, not as a string
    if (opacity < 0) {
      return `rgba(${defaultRed}, ${defaultGreen}, ${defaultBlue}, 0.3)`;
    }
    
    return `rgba(${defaultRed}, ${defaultGreen}, ${defaultBlue}, ${opacity})`;
  }
};

// Add the missing filterEventsByDate function
export const filterEventsByDate = (events: CalendarEvent[], date: Date): CalendarEvent[] => {
  return events.filter(event => isSameDay(event.start, date));
};
