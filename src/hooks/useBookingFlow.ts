
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Service } from '@/supabase-types';
import { Barber } from '@/hooks/useBarbers';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { isTimeSlotBooked } from '@/utils/bookingUtils';
import { CalendarEvent } from '@/types/calendar';
import { ExistingBooking } from '@/types/booking';
import { useBarberServices } from './useBarberServices';
import { useDateAvailability } from './useDateAvailability';
import { useTimeSlots } from './useTimeSlots';
import { fetchExistingBookings } from '@/utils/bookingTimeUtils';
import { useBookings } from './useBookings';

export type BookingStep = 'barber' | 'service' | 'datetime' | 'notes';

export const useBookingFlow = (
  barbers: Barber[],
  services: Service[],
  allEvents: CalendarEvent[]
) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBooking, isLoading: bookingLoading } = useBookings();

  // UI State
  const [step, setStep] = useState<BookingStep>('barber');
  
  // Form Data
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  
  // Entity Data
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<Service | null>(null);
  
  // Custom hooks
  const { barberServices, isLoadingBarberServices, fetchBarberServices } = useBarberServices();
  const { isDateDisabled, isCheckingDates, today, maxDate, error: calendarError } = useDateAvailability(
    selectedBarber, 
    selectedServiceDetails?.duration,
    allEvents
  );
  const { availableTimeSlots, isLoadingTimeSlots } = useTimeSlots(
    selectedDate,
    selectedBarber,
    selectedServiceDetails,
    existingBookings
  );

  // Handler functions
  const handleSelectBarber = (barberId: string) => {
    const selectedBarberObj = barbers.find(b => b.id === barberId);
    if (!selectedBarberObj || !selectedBarberObj.active) {
      toast.error("This barber is currently unavailable");
      return;
    }
    
    setSelectedBarber(barberId);
    setSelectedService(null);
    setSelectedServiceDetails(null);
    fetchBarberServices(barberId, services);
    setStep('service');
  };

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId);
    const serviceDetails = services.find(s => s.id === serviceId) || null;
    setSelectedServiceDetails(serviceDetails);
    setStep('datetime');
  };

  const handleBackToBarbers = () => {
    setStep('barber');
    setSelectedBarber(null);
    setSelectedService(null);
    setSelectedServiceDetails(null);
  };

  const handleBackToServices = () => {
    setStep('service');
    setSelectedService(null);
    setSelectedServiceDetails(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
  };

  const handleDateTimeComplete = () => {
    if (selectedDate && selectedTime) {
      setStep('notes');
    } else {
      toast.error('Please select both date and time');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in to book an appointment');
      navigate('/login');
      return;
    }

    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Final checks before booking
      const isHoliday = isBarberHolidayDate(allEvents, selectedDate, selectedBarber);
      if (isHoliday) {
        toast.error('Cannot book on this date as the barber is on holiday');
        return;
      }
      
      const currentBookingTimeSlotAvailable = availableTimeSlots.includes(selectedTime);
      if (!currentBookingTimeSlotAvailable) {
        toast.error('The selected time is no longer available. Please choose another time.');
        return;
      }
      
      const bookingOverlaps = isTimeSlotBooked(selectedTime, selectedServiceDetails, existingBookings);
      if (bookingOverlaps) {
        toast.error('This time slot conflicts with an existing booking. Please select another time.');
        return;
      }

      const result = await createBooking({
        barber_id: selectedBarber,
        service_id: selectedService,
        booking_date: formattedDate,
        booking_time: selectedTime,
        notes: notes.trim() || null
      });

      if (result) {
        toast.success('Booking created successfully!');
        navigate('/profile');
      }
    } catch (error) {
      console.error('Booking error:', error);
    }
  };

  // Fetch existing bookings when date changes
  useEffect(() => {
    const loadBookings = async () => {
      if (selectedBarber && selectedDate) {
        setIsLoadingBookings(true);
        try {
          const bookings = await fetchExistingBookings(selectedBarber, selectedDate, allEvents);
          setExistingBookings(bookings);
        } finally {
          setIsLoadingBookings(false);
        }
      }
    };

    loadBookings();
  }, [selectedBarber, selectedDate, allEvents]);

  return {
    // State
    step,
    selectedBarber,
    barberServices,
    selectedService,
    selectedDate,
    selectedTime,
    notes,
    isLoadingBarberServices,
    existingBookings,
    isLoadingBookings,
    selectedServiceDetails,
    availableTimeSlots,
    isLoadingTimeSlots,
    isCheckingDates,
    today,
    maxDate,
    bookingLoading,
    calendarError,   // Add the missing calendarError property

    // Setters
    setSelectedDate,
    setSelectedTime,
    setNotes,

    // Functions
    isDateDisabled,
    handleSelectBarber,
    handleSelectService,
    handleBackToBarbers,
    handleBackToServices,
    handleDateTimeComplete,
    handleSubmit
  };
};
