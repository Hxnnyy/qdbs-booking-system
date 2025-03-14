
import React, { useState, useEffect } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { getStepTitle } from '@/utils/bookingUtils';
import { BookingFormState } from '@/types/booking';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';
import BookingStepRenderer from './BookingStepRenderer';
import { useBookingWorkflow } from '@/hooks/useBookingWorkflow';
import { CalendarEvent } from '@/types/calendar';
import { isTimeSlotBooked, isWithinOpeningHours, hasAvailableSlotsOnDay } from '@/utils/bookingUtils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';

interface GuestBookingWorkflowProps {
  barbers: Barber[];
  services: Service[];
  formState: BookingFormState;
  updateFormState: (updates: Partial<BookingFormState>) => void;
  barberServices: Service[];
  existingBookings: any[];
  isLoading: boolean;
  fetchBarberServices: (barberId: string) => Promise<void>;
  calendarEvents?: CalendarEvent[];
  availableTimeSlots?: string[];
  isLoadingTimeSlots?: boolean;
  isCheckingDates?: boolean;
  isDateDisabled?: (date: Date) => boolean;
}

const GuestBookingWorkflow: React.FC<GuestBookingWorkflowProps> = ({
  barbers,
  services,
  formState,
  updateFormState,
  barberServices,
  existingBookings,
  isLoading,
  fetchBarberServices,
  calendarEvents = [],
  availableTimeSlots = [],
  isLoadingTimeSlots = false,
  isCheckingDates = false,
  isDateDisabled = () => false
}) => {
  const {
    step,
    showSuccess,
    bookingResult,
    bookingLoading,
    handleSelectBarber,
    handleSelectService,
    handleBackToBarbers,
    handleBackToServices,
    handleDateTimeComplete,
    handleBackToDateTime,
    handleGuestInfoComplete,
    handleBackToGuestInfo,
    handleVerificationComplete,
    handleBackToVerification,
    handleSubmit
  } = useBookingWorkflow(formState, updateFormState, fetchBarberServices, services);

  const [calculatedTimeSlots, setCalculatedTimeSlots] = useState<string[]>([]);
  const [isCalculatingTimeSlots, setIsCalculatingTimeSlots] = useState<boolean>(false);
  const [timeSlotError, setTimeSlotError] = useState<string | null>(null);

  useEffect(() => {
    const calculateAvailableTimeSlots = async () => {
      if (!formState.selectedDate || !formState.selectedBarber || !formState.selectedServiceDetails) {
        setCalculatedTimeSlots([]);
        return;
      }
      
      setIsCalculatingTimeSlots(true);
      setTimeSlotError(null);
      
      try {
        // Check if the barber is on holiday
        const isHoliday = isBarberHolidayDate(calendarEvents, formState.selectedDate, formState.selectedBarber);
        
        if (isHoliday) {
          setTimeSlotError('Barber is on holiday on this date.');
          setCalculatedTimeSlots([]);
          setIsCalculatingTimeSlots(false);
          return;
        }
        
        const slots = await fetchBarberTimeSlots(
          formState.selectedBarber, 
          formState.selectedDate, 
          formState.selectedServiceDetails.duration
        );
        
        setCalculatedTimeSlots(slots);
      } catch (error) {
        console.error('Error calculating time slots:', error);
        setTimeSlotError('Failed to load available time slots');
        toast.error('Failed to load available time slots');
      } finally {
        setIsCalculatingTimeSlots(false);
      }
    };
    
    calculateAvailableTimeSlots();
  }, [formState.selectedDate, formState.selectedBarber, formState.selectedServiceDetails, existingBookings, calendarEvents]);

  const fetchBarberTimeSlots = async (barberId: string, date: Date, serviceDuration: number) => {
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
          formState.selectedServiceDetails, 
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

  const checkDateAvailability = async (date: Date): Promise<boolean> => {
    if (!formState.selectedBarber || !formState.selectedServiceDetails) return false;
    
    try {
      // First check if the barber is on holiday
      if (isBarberHolidayDate(calendarEvents, date, formState.selectedBarber)) {
        return false;
      }
      
      return await hasAvailableSlotsOnDay(
        formState.selectedBarber,
        date,
        existingBookings,
        formState.selectedServiceDetails.duration
      );
    } catch (error) {
      console.error('Error checking date availability:', error);
      return false;
    }
  };

  const checkIsDateDisabled = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) {
      return true;
    }
    
    // Check if barber is on holiday
    if (isBarberHolidayDate(calendarEvents, date, formState.selectedBarber)) {
      return true;
    }
    
    return false;
  };

  const handlers = {
    handleSelectBarber,
    handleSelectService,
    handleBackToBarbers,
    handleBackToServices,
    handleDateTimeComplete,
    handleBackToDateTime,
    handleGuestInfoComplete,
    handleBackToGuestInfo,
    handleVerificationComplete,
    handleBackToVerification,
    handleSubmit
  };

  if (isLoading && !showSuccess) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold font-playfair text-center mb-6">{getStepTitle(step)}</h2>
      
      <BookingStepRenderer 
        step={step}
        formState={formState}
        updateFormState={updateFormState}
        barbers={barbers}
        services={services}
        barberServices={barberServices}
        existingBookings={existingBookings}
        bookingLoading={bookingLoading}
        bookingResult={bookingResult}
        handlers={handlers}
        allEvents={calendarEvents}
        selectedBarberId={formState.selectedBarber}
        availableTimeSlots={calculatedTimeSlots}
        isLoadingTimeSlots={isCalculatingTimeSlots}
        isCheckingDates={isCheckingDates}
        isDateDisabled={checkIsDateDisabled}
        timeSlotError={timeSlotError}
      />
    </div>
  );
};

export default GuestBookingWorkflow;
