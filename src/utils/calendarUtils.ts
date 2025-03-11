import { format, parseISO, isSameDay } from 'date-fns';
import { CalendarEvent as CalendarEventType } from '@/types/calendar';
import { Booking, LunchBreak } from '@/supabase-types';

// Function to convert a booking to a calendar event
export const bookingToCalendarEvent = (booking: Booking): CalendarEventType => {
  try {
    const start = parseISO(`${booking.booking_date}T${booking.booking_time}:00`);
    const durationInMinutes = booking.service?.duration || 60;
    const end = new Date(start.getTime() + durationInMinutes * 60000); // Convert minutes to milliseconds
    
    return {
      id: booking.id,
      title: booking.service?.name || 'Booking',
      start: start,
      end: end,
      barber: booking.barber?.name || 'Unknown Barber',
      service: booking.service?.name || 'Unknown Service',
      barberId: booking.barber_id,
      serviceId: booking.service_id,
      status: booking.status,
      notes: booking.notes || '',
    };
  } catch (error) {
    console.error("Error converting booking to calendar event:", error, booking);
    throw error; // Re-throw the error to be caught by the caller
  }
};

// Function to create a calendar event from a lunch break
export const createLunchBreakEvent = (lunchBreak: LunchBreak): CalendarEventType => {
  try {
    // Ensure start_time is in HH:mm format
    const [hours, minutes] = lunchBreak.start_time.split(':').map(Number);
    
    // Create a date object for today with the lunch break's start time
    const today = new Date();
    today.setHours(hours, minutes, 0, 0);
    
    const start = today;
    const durationInMinutes = lunchBreak.duration || 30;
    const end = new Date(start.getTime() + durationInMinutes * 60000); // Convert minutes to milliseconds
    
    return {
      id: `lunch-${lunchBreak.id}`, // Unique ID for lunch breaks
      title: 'Lunch Break',
      start: start,
      end: end,
      barber: 'N/A', // Lunch breaks don't have a barber
      service: 'N/A', // Lunch breaks don't have a service
      barberId: lunchBreak.barber_id,
      serviceId: 'N/A', // No service ID for lunch breaks
      status: 'lunch-break', // Custom status for lunch breaks
      notes: '', // No notes for lunch breaks
    };
  } catch (error) {
    console.error("Error converting lunch break to calendar event:", error, lunchBreak);
    throw error; // Re-throw the error to be caught by the caller
  }
};

// Function to filter events by date
export const filterEventsByDate = (events: CalendarEventType[], date: Date): CalendarEventType[] => {
  return events.filter(event => isSameDay(event.start, date));
};

// Function to format a new booking date
export const formatNewBookingDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

// Function to format a new booking time
export const formatNewBookingTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

// Function to get a barber's color
export const getBarberColor = async (barberId: string, isLight = false): Promise<string> => {
  // Use a default color if barberId is not provided or if the color is not found
  if (!barberId) {
    return '#3498db'; // Default blue color
  }
  
  // Fetch the barber's color from local storage
  const storedColors = localStorage.getItem('barberColors');
  let barberColors: { [key: string]: string } = storedColors ? JSON.parse(storedColors) : {};
  
  // If the color is already in local storage, return it
  if (barberColors[barberId]) {
    return barberColors[barberId];
  }
  
  // Generate a random color
  const randomColor = generateRandomColor();
  
  // Store the new color in local storage
  barberColors[barberId] = randomColor;
  localStorage.setItem('barberColors', JSON.stringify(barberColors));
  
  return randomColor;
};

// Function to generate a random color
const generateRandomColor = (): string => {
  let r = Math.floor(Math.random() * 256);
  let g = Math.floor(Math.random() * 256);
  let b = Math.floor(Math.random() * 256);
  
  // Ensure the color is not too light
  while (isLightColor(r, g, b)) {
    r = Math.floor(Math.random() * 256);
    g = Math.floor(Math.random() * 256);
    b = Math.floor(Math.random() * 256);
  }
  
  return `rgb(${r}, ${g}, ${b})`;
};

export const isLightColor = (r: number, g: number, b: number): boolean => {
  // Calculate brightness using the formula (0.299*R + 0.587*G + 0.114*B)
  const brightness = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  // Compare with a numeric value, ensuring both are numbers
  return brightness > 0.7;
};
