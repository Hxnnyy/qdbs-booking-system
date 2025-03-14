
import { format, isBefore, set, startOfDay } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

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

// Check if a time slot is in the past (for today's date)
export const isTimeSlotInPast = (date: Date, timeSlot: string): boolean => {
  // Only relevant for today's date
  if (!isSameDay(date, new Date())) {
    return false;
  }
  
  const [hours, minutes] = timeSlot.split(':').map(Number);
  const timeSlotDate = set(new Date(date), { hours, minutes });
  
  return isBefore(timeSlotDate, new Date());
};

// Compare if two dates are the same day
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};
