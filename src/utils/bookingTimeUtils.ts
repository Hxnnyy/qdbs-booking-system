
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/supabase-types';
import { ExistingBooking } from '@/types/booking';
import { isTimeSlotBooked, isWithinOpeningHours } from './bookingUtils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { isBarberHolidayDate } from './holidayIndicatorUtils';
import { CalendarEvent } from '@/types/calendar';

// Fetch time slots for a specific barber on a given day
export const fetchBarberTimeSlots = async (barberId: string, date: Date) => {
  try {
    const dayOfWeek = date.getDay();
    
    const { data, error } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek)
      .maybeSingle();
    
    if (error) {
      throw error;
    }
    
    if (!data || data.is_closed) {
      return [];
    }
    
    const slots = [];
    let currentTime = data.open_time;
    const closeTime = data.close_time;
    
    let [openHours, openMinutes] = currentTime.split(':').map(Number);
    const [closeHours, closeMinutes] = closeTime.split(':').map(Number);
    
    const closeTimeInMinutes = closeHours * 60 + closeMinutes;
    
    while (true) {
      const timeInMinutes = openHours * 60 + openMinutes;
      if (timeInMinutes >= closeTimeInMinutes) {
        break;
      }
      
      const formattedHours = openHours.toString().padStart(2, '0');
      const formattedMinutes = openMinutes.toString().padStart(2, '0');
      slots.push(`${formattedHours}:${formattedMinutes}`);
      
      openMinutes += 30;
      if (openMinutes >= 60) {
        openHours += 1;
        openMinutes -= 60;
      }
    }
    
    return slots;
  } catch (error) {
    console.error('Error fetching barber time slots:', error);
    return [];
  }
};

// Filter available time slots based on barber availability and existing bookings
export const filterTimeSlots = async (
  selectedDate: Date | undefined, 
  selectedBarber: string | null, 
  selectedServiceDetails: Service | null,
  existingBookings: ExistingBooking[]
) => {
  if (!selectedDate || !selectedBarber || !selectedServiceDetails) {
    return [];
  }
  
  try {
    const barberTimeSlots = await fetchBarberTimeSlots(selectedBarber, selectedDate);
    
    if (barberTimeSlots.length === 0) {
      return [];
    }
    
    const availableSlots = [];
    
    for (const time of barberTimeSlots) {
      const isAvailable = await isWithinOpeningHours(
        selectedBarber,
        selectedDate,
        time,
        selectedServiceDetails.duration
      );
      
      const isBooked = isTimeSlotBooked(time, selectedServiceDetails, existingBookings);
      
      if (isAvailable && !isBooked) {
        availableSlots.push(time);
      }
    }
    
    return availableSlots;
  } catch (error) {
    console.error('Error filtering time slots:', error);
    return [];
  }
};

// Check if a day has any available slots
export const fetchExistingBookings = async (barberId: string, date: Date, allEvents: CalendarEvent[] = []) => {
  try {
    const formattedDate = format(date, 'yyyy-MM-dd');
    
    const isHoliday = isBarberHolidayDate(allEvents, date, barberId);
    
    if (isHoliday) {
      toast.error('Barber is on holiday on this date. Please select another date.');
      return [];
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .select('booking_time, service_id, services(duration)')
      .eq('barber_id', barberId)
      .eq('booking_date', formattedDate)
      .eq('status', 'confirmed')
      .order('booking_time');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Error fetching bookings:', error);
    toast.error('Failed to load existing bookings');
    return [];
  }
};
