
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isTimeSlotBooked, isWithinOpeningHours } from '@/utils/bookingUtils';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { isTimeSlotInPast } from '@/utils/bookingUpdateUtils';
import { CalendarEvent } from '@/types/calendar';
import { Service } from '@/supabase-types';

/**
 * Custom hook to calculate available time slots for a barber on a specific date
 */
export const useTimeSlots = (
  selectedDate: Date | undefined,
  selectedBarberId: string | null,
  selectedService: Service | null,
  existingBookings: any[],
  calendarEvents: CalendarEvent[] = []
) => {
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const calculateAvailableTimeSlots = async () => {
      if (!selectedDate || !selectedBarberId || !selectedService) {
        setTimeSlots([]);
        setError(null);
        return;
      }
      
      setIsCalculating(true);
      setError(null);
      
      try {
        // Check if the barber is on holiday
        const isHoliday = isBarberHolidayDate(calendarEvents, selectedDate, selectedBarberId);
        
        if (isHoliday) {
          setError('Barber is on holiday on this date.');
          setTimeSlots([]);
          return;
        }
        
        const slots = await fetchBarberTimeSlots(
          selectedBarberId, 
          selectedDate, 
          selectedService.duration,
          existingBookings
        );
        
        // Filter out time slots that are in the past (for today only)
        const filteredSlots = slots.filter(
          timeSlot => !isTimeSlotInPast(selectedDate, timeSlot)
        );
        
        setTimeSlots(filteredSlots);
      } catch (err) {
        console.error('Error calculating time slots:', err);
        setError('Failed to load available time slots');
        toast.error('Failed to load available time slots');
      } finally {
        setIsCalculating(false);
      }
    };
    
    calculateAvailableTimeSlots();
  }, [selectedDate, selectedBarberId, selectedService, existingBookings, calendarEvents]);

  return {
    timeSlots,
    isCalculating,
    error
  };
};

/**
 * Fetch available time slots for a barber on a specific date
 */
export const fetchBarberTimeSlots = async (
  barberId: string, 
  date: Date, 
  serviceDuration: number,
  existingBookings: any[] = []
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
    
    const slots = [];
    let currentTime = data.open_time;
    const closeTime = data.close_time;
    
    let [openHours, openMinutes] = currentTime.split(':').map(Number);
    const [closeHours, closeMinutes] = closeTime.split(':').map(Number);
    
    const closeTimeInMinutes = closeHours * 60 + closeMinutes;
    
    // Get lunch break times for this barber
    const { data: lunchBreaks, error: lunchError } = await supabase
      .from('barber_lunch_breaks')
      .select('*')
      .eq('barber_id', barberId)
      .eq('is_active', true);
    
    if (lunchError) {
      console.error('Error fetching lunch breaks:', lunchError);
    }
    
    // Create a function to check if a time slot overlaps with a lunch break
    const isLunchBreak = (timeSlot: string) => {
      if (!lunchBreaks || lunchBreaks.length === 0) return false;
      
      const [hours, minutes] = timeSlot.split(':').map(Number);
      const timeInMinutes = hours * 60 + minutes;
      
      return lunchBreaks.some(breakTime => {
        const [breakHours, breakMinutes] = breakTime.start_time.split(':').map(Number);
        const breakStartMinutes = breakHours * 60 + breakMinutes;
        const breakEndMinutes = breakStartMinutes + breakTime.duration;
        
        // Check if slot starts during lunch break or if service would overlap with lunch break
        return (timeInMinutes >= breakStartMinutes && timeInMinutes < breakEndMinutes) || 
               (timeInMinutes < breakStartMinutes && (timeInMinutes + serviceDuration) > breakStartMinutes);
      });
    };
    
    while (true) {
      const timeInMinutes = openHours * 60 + openMinutes;
      if (timeInMinutes >= closeTimeInMinutes) {
        break;
      }
      
      const formattedHours = openHours.toString().padStart(2, '0');
      const formattedMinutes = openMinutes.toString().padStart(2, '0');
      const timeSlot = `${formattedHours}:${formattedMinutes}`;
      
      const isBooked = isTimeSlotBooked(
        timeSlot, 
        { duration: serviceDuration } as any, 
        existingBookings
      );
      
      const withinHours = await isWithinOpeningHours(
        barberId,
        date,
        timeSlot,
        serviceDuration
      );
      
      const isOnLunchBreak = isLunchBreak(timeSlot);
      
      if (!isBooked && withinHours && !isOnLunchBreak) {
        slots.push(timeSlot);
      }
      
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
