
import { supabase } from '@/integrations/supabase/client';
import { generatePossibleTimeSlots, filterAvailableTimeSlots } from '@/utils/timeSlotUtils';
import { isWithinOpeningHours } from '@/utils/bookingUtils';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { CalendarEvent } from '@/types/calendar';

/**
 * Fetch lunch breaks for a barber
 */
export const fetchBarberLunchBreaks = async (barberId: string): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('barber_lunch_breaks')
      .select('*')
      .eq('barber_id', barberId)
      .eq('is_active', true);
      
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching lunch breaks:', err);
    return [];
  }
};

/**
 * Fetch available time slots for a barber on a specific date
 */
export const fetchBarberTimeSlots = async (
  barberId: string, 
  date: Date, 
  serviceDuration: number,
  existingBookings: any[] = [],
  cachedLunchBreaks: any[] = []
): Promise<string[]> => {
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
    
    // Use cached lunch breaks if available, otherwise fetch them
    let lunchBreaks = cachedLunchBreaks;
    
    if (!lunchBreaks || lunchBreaks.length === 0) {
      lunchBreaks = await fetchBarberLunchBreaks(barberId);
    }
    
    // Generate all possible time slots
    const possibleSlots = generatePossibleTimeSlots(data.open_time, data.close_time);
    
    // Filter slots based on availability
    const availableSlots = filterAvailableTimeSlots(
      possibleSlots,
      serviceDuration,
      existingBookings,
      lunchBreaks
    );
    
    // Further filter slots based on opening hours
    const withinOpeningHoursSlots = [];
    
    for (const slot of availableSlots) {
      const withinHours = await isWithinOpeningHours(
        barberId,
        date,
        slot,
        serviceDuration
      );
      
      if (withinHours) {
        withinOpeningHoursSlots.push(slot);
      }
    }
    
    return withinOpeningHoursSlots;
  } catch (error) {
    console.error('Error fetching barber time slots:', error);
    return [];
  }
};

/**
 * Check if a barber is available on a date
 */
export const checkBarberAvailability = (
  date: Date | undefined,
  barberId: string | null,
  calendarEvents: CalendarEvent[]
): { isAvailable: boolean, errorMessage: string | null } => {
  if (!date || !barberId) {
    return { isAvailable: true, errorMessage: null };
  }
  
  const isHoliday = isBarberHolidayDate(calendarEvents, date, barberId);
  
  if (isHoliday) {
    return { 
      isAvailable: false, 
      errorMessage: 'Barber is on holiday on this date.' 
    };
  }
  
  return { isAvailable: true, errorMessage: null };
};
