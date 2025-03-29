import { useState, useEffect } from 'react';
import { format, isBefore, startOfToday, addMonths } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useBookings } from '@/hooks/useBookings';
import { toast } from 'sonner';
import { Service } from '@/supabase-types';
import { Barber } from '@/hooks/useBarbers';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { isWithinOpeningHours, isTimeSlotBooked, hasAvailableSlotsOnDay } from '@/utils/bookingUtils';
import { CalendarEvent } from '@/types/calendar';
import { ExistingBooking } from '@/types/booking';

export type BookingStep = 'barber' | 'service' | 'datetime' | 'notes';

export const useBookingFlow = (
  barbers: Barber[],
  services: Service[],
  allEvents: CalendarEvent[]
) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createBooking, isLoading: bookingLoading } = useBookings();

  const [step, setStep] = useState<BookingStep>('barber');
  
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [barberServices, setBarberServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  
  const [isLoadingBarberServices, setIsLoadingBarberServices] = useState<boolean>(false);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<Service | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [isCheckingDates, setIsCheckingDates] = useState<boolean>(false);
  
  const today = startOfToday();
  const maxDate = addMonths(today, 6);

  const fetchBarberServices = async (barberId: string) => {
    try {
      setIsLoadingBarberServices(true);
      
      const { data: barberServiceLinks, error: barberServicesError } = await supabase
        .from('barber_services')
        .select('service_id')
        .eq('barber_id', barberId);
      
      if (barberServicesError) throw barberServicesError;
      
      if (barberServiceLinks && barberServiceLinks.length > 0) {
        const serviceIds = barberServiceLinks.map(item => item.service_id);
        
        const { data: serviceDetails, error: serviceDetailsError } = await supabase
          .from('services')
          .select('*')
          .in('id', serviceIds)
          .eq('active', true)
          .order('name');
        
        if (serviceDetailsError) throw serviceDetailsError;
        
        setBarberServices(serviceDetails || []);
      } else {
        setBarberServices(services.filter(service => service.active));
      }
    } catch (error) {
      console.error('Error fetching barber services:', error);
      toast.error('Failed to load services for this barber');
      setBarberServices(services.filter(service => service.active));
    } finally {
      setIsLoadingBarberServices(false);
    }
  };

  const fetchExistingBookings = async (barberId: string, date: Date) => {
    try {
      setIsLoadingBookings(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const isHoliday = isBarberHolidayDate(allEvents, date, barberId);
      
      if (isHoliday) {
        toast.error('Barber is on holiday on this date. Please select another date.');
        setExistingBookings([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_time, service_id, services(duration)')
        .eq('barber_id', barberId)
        .eq('booking_date', formattedDate)
        .eq('status', 'confirmed')
        .order('booking_time');
      
      if (error) throw error;
      
      console.log('Existing bookings:', data);
      setExistingBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load existing bookings');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const fetchBarberTimeSlots = async (barberId: string, date: Date) => {
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

  const filterTimeSlots = async () => {
    if (!selectedDate || !selectedBarber || !selectedServiceDetails) {
      setAvailableTimeSlots([]);
      return;
    }
    
    setIsLoadingTimeSlots(true);
    
    try {
      const barberTimeSlots = await fetchBarberTimeSlots(selectedBarber, selectedDate);
      
      if (barberTimeSlots.length === 0) {
        setAvailableTimeSlots([]);
        setIsLoadingTimeSlots(false);
        return;
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
      
      setAvailableTimeSlots(availableSlots);
    } catch (error) {
      console.error('Error filtering time slots:', error);
      toast.error('Failed to load available time slots');
    } finally {
      setIsLoadingTimeSlots(false);
    }
  };

  const shouldDisableDate = (date: Date) => {
    if (isBefore(date, today) || isBefore(maxDate, date)) {
      return true;
    }
    
    if (selectedBarber) {
      return isBarberHolidayDate(allEvents, date, selectedBarber);
    }
    
    return false;
  };

  const isDateDisabled = (date: Date) => {
    if (shouldDisableDate(date)) {
      return true;
    }
    
    return disabledDates.some(disabledDate => 
      disabledDate.getDate() === date.getDate() && 
      disabledDate.getMonth() === date.getMonth() && 
      disabledDate.getFullYear() === date.getFullYear()
    );
  };

  const handleSelectBarber = (barberId: string) => {
    const selectedBarberObj = barbers.find(b => b.id === barberId);
    if (!selectedBarberObj || !selectedBarberObj.active) {
      toast.error("This barber is currently unavailable");
      return;
    }
    
    setSelectedBarber(barberId);
    setSelectedService(null);
    setSelectedServiceDetails(null);
    fetchBarberServices(barberId);
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
      
      const isHoliday = isBarberHolidayDate(allEvents, selectedDate, selectedBarber);
      if (isHoliday) {
        toast.error('Cannot book on this date as the barber is on holiday');
        return;
      }
      
      const bookingOverlaps = isTimeSlotBooked(selectedTime, selectedServiceDetails, existingBookings);
      if (bookingOverlaps) {
        toast.error('This time slot conflicts with an existing booking. Please select another time.');
        return;
      }

      const serviceDuration = selectedServiceDetails?.duration || 60;
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const selectedTimeInMinutes = hours * 60 + minutes;
      const endTimeInMinutes = selectedTimeInMinutes + serviceDuration;
      
      console.log(`Final validation - Booking from ${selectedTime} to ${Math.floor(endTimeInMinutes/60)}:${String(endTimeInMinutes % 60).padStart(2, '0')}`);
      console.log(`Service duration: ${serviceDuration} minutes`);

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
      toast.error('Failed to create booking. Please try again later.');
    }
  };

  useEffect(() => {
    const checkMonthAvailability = async () => {
      if (!selectedBarber || !selectedServiceDetails) return;
      
      setIsCheckingDates(true);
      
      try {
        const daysToCheck = [];
        const currentDate = new Date(today);
        
        for (let i = 0; i < 30; i++) {
          const dateToCheck = new Date(currentDate);
          dateToCheck.setDate(currentDate.getDate() + i);
          
          if (!shouldDisableDate(dateToCheck)) {
            daysToCheck.push(dateToCheck);
          }
        }
        
        const unavailableDays = [];
        
        for (const date of daysToCheck) {
          const hasSlots = await hasAvailableSlotsOnDay(
            selectedBarber, 
            date, 
            existingBookings,
            selectedServiceDetails.duration
          );
          
          if (!hasSlots) {
            unavailableDays.push(date);
          }
        }
        
        setDisabledDates(unavailableDays);
      } catch (error) {
        console.error('Error checking month availability:', error);
      } finally {
        setIsCheckingDates(false);
      }
    };
    
    checkMonthAvailability();
  }, [selectedBarber, selectedServiceDetails]);

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      fetchExistingBookings(selectedBarber, selectedDate);
    }
  }, [selectedBarber, selectedDate]);

  useEffect(() => {
    if (selectedDate && selectedBarber && selectedServiceDetails) {
      filterTimeSlots();
    }
  }, [selectedDate, selectedBarber, selectedServiceDetails, existingBookings]);

  return {
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
    disabledDates,
    isCheckingDates,
    today,
    maxDate,
    bookingLoading,

    setSelectedDate,
    setSelectedTime,
    setNotes,

    isDateDisabled,
    handleSelectBarber,
    handleSelectService,
    handleBackToBarbers,
    handleBackToServices,
    handleDateTimeComplete,
    handleSubmit
  };
};
