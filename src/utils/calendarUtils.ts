import { format } from 'date-fns';
import { Booking, Barber, Service, LunchBreak } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';

// Function to convert HSL color to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export const bookingToCalendarEvent = (booking: Booking): CalendarEvent => {
  if (!booking.barber || !booking.service) {
    throw new Error('Barber or Service data is missing in booking');
  }

  const barber = booking.barber as Barber;
  const service = booking.service as Service;

  const start = new Date(`${booking.booking_date}T${booking.booking_time}`);
  const end = new Date(start.getTime() + service.duration * 60000); // Convert minutes to milliseconds

  // Use the barber's color if available, otherwise use a default color
  const backgroundColor = barber.color || '#3b82f6'; // Default Indigo 500

  return {
    id: booking.id,
    title: `${service.name} - ${booking.guest_booking ? 'Guest' : booking.user_id}`,
    start,
    end,
    allDay: false,
    resourceId: barber.id,
    backgroundColor,
    borderColor: backgroundColor,
    extendedProps: {
      notes: booking.notes,
    },
    barber: barber.name,
    service: service.name,
    barberId: barber.id,
    serviceId: service.id,
  };
};

export const createLunchBreakEvent = (lunchBreak: LunchBreak): CalendarEvent => {
  if (!lunchBreak.barber) {
    throw new Error('Barber data is missing in lunch break');
  }

  const barber = lunchBreak.barber as Barber;
  const startTime = lunchBreak.start_time;
  const [hours, minutes] = startTime.split(':').map(Number);

  // Get the current date
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
  const end = new Date(start.getTime() + lunchBreak.duration * 60000); // Convert minutes to milliseconds

  const backgroundColor = '#a8a29e'; // Slate-400

  return {
    id: `lunch-${lunchBreak.id}`,
    title: 'Lunch Break',
    start,
    end,
    allDay: false,
    resourceId: barber.id,
    backgroundColor,
    borderColor: backgroundColor,
    editable: false,
    barber: barber.name,
    barberId: barber.id,
  };
};

export const formatNewBookingDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

export const formatNewBookingTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

export function hexToRgba(hexColor: string, alpha: number = 1, returnRGB: boolean = false): string {
  // Parse hex color
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // If we want RGB format instead of RGBA
  if (returnRGB) {
    // Convert HSL to RGB for better control of transparency
    const h = 120 / 360;
    const s = 0.7; // 70% saturation 
    const l = 0.6; // 60% lightness
    
    let r: number, g: number, b: number;
    
    // Fix the TypeScript error by using number comparison with explicit type
    if (Number(s) === 0) {
      r = g = b = l; // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
  
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }
  
    r = Math.round(r * 255);
    g = Math.round(g * 255);
    b = Math.round(b * 255);
  }
  
  // Return rgba format
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
