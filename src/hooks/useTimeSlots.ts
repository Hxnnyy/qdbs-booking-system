
import { useState, useEffect } from 'react';
import { Service } from '@/supabase-types';
import { ExistingBooking } from '@/types/booking';
import { filterTimeSlots } from '@/utils/bookingTimeUtils';

export const useTimeSlots = (
  selectedDate: Date | undefined, 
  selectedBarber: string | null, 
  selectedServiceDetails: Service | null,
  existingBookings: ExistingBooking[]
) => {
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false);

  useEffect(() => {
    const loadTimeSlots = async () => {
      if (selectedDate && selectedBarber && selectedServiceDetails) {
        setIsLoadingTimeSlots(true);
        try {
          const slots = await filterTimeSlots(
            selectedDate,
            selectedBarber,
            selectedServiceDetails,
            existingBookings
          );
          setAvailableTimeSlots(slots);
        } catch (error) {
          console.error('Error loading time slots:', error);
          setAvailableTimeSlots([]);
        } finally {
          setIsLoadingTimeSlots(false);
        }
      } else {
        setAvailableTimeSlots([]);
      }
    };

    loadTimeSlots();
  }, [selectedDate, selectedBarber, selectedServiceDetails, existingBookings]);

  return {
    availableTimeSlots,
    isLoadingTimeSlots
  };
};
