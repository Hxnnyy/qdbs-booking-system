
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

// Check if the barber is available based on opening hours
export const isBarberAvailable = async (
  barberId: string, 
  date: Date,
  time: string
): Promise<{ available: boolean; reason?: string }> => {
  try {
    const dayOfWeek = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
    
    // First check if the barber is on holiday
    const onHoliday = await isBarberOnHoliday(barberId, date);
    if (onHoliday) {
      return { available: false, reason: 'Barber is on holiday on this date' };
    }
    
    // Check opening hours for this day of week
    const { data: openingHours, error: openingHoursError } = await supabase
      .from('opening_hours')
      .select('*')
      .eq('barber_id', barberId)
      .eq('day_of_week', dayOfWeek);
    
    if (openingHoursError) {
      console.error('Error checking opening hours:', openingHoursError);
      return { available: false, reason: 'Error checking barber availability' };
    }
    
    // If no opening hours found, assume shop is closed that day
    if (!openingHours || openingHours.length === 0) {
      return { available: false, reason: 'No opening hours set for this day' };
    }
    
    const shopHours = openingHours[0];
    
    // Check if the shop is closed that day
    if (shopHours.is_closed) {
      return { available: false, reason: 'Shop is closed on this day' };
    }
    
    // Parse the time string (HH:MM format)
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    
    // Parse open and close times
    const [openHours, openMinutes] = shopHours.open_time.split(':').map(Number);
    const openTimeInMinutes = openHours * 60 + openMinutes;
    
    const [closeHours, closeMinutes] = shopHours.close_time.split(':').map(Number);
    const closeTimeInMinutes = closeHours * 60 + closeMinutes;
    
    // Check if time is within opening hours
    if (timeInMinutes < openTimeInMinutes) {
      return { 
        available: false, 
        reason: `Shop opens at ${shopHours.open_time} on this day` 
      };
    }
    
    if (timeInMinutes >= closeTimeInMinutes) {
      return { 
        available: false, 
        reason: `Shop closes at ${shopHours.close_time} on this day` 
      };
    }
    
    return { available: true };
  } catch (error) {
    console.error('Error checking barber availability:', error);
    return { available: false, reason: 'Error checking barber availability' };
  }
};
