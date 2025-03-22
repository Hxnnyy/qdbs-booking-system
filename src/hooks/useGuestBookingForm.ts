
import { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isBarberOnHoliday } from '@/utils/calendarUtils';
import { BookingFormState, ExistingBooking } from '@/types/booking';
import { Service } from '@/supabase-types';
import { Barber } from '@/hooks/useBarbers';

export const useGuestBookingForm = () => {
  // Form state
  const [formState, setFormState] = useState<BookingFormState>({
    selectedBarber: null,
    selectedService: null,
    selectedDate: undefined,
    selectedTime: null,
    guestName: '',
    guestPhone: '',
    guestEmail: '',
    notes: '',
    selectedServiceDetails: null,
    isPhoneVerified: false
  });

  // UI state
  const [barberServices, setBarberServices] = useState<Service[]>([]);
  const [serviceBarbers, setServiceBarbers] = useState<Barber[]>([]);
  const [isLoadingBarberServices, setIsLoadingBarberServices] = useState<boolean>(false);
  const [isLoadingServiceBarbers, setIsLoadingServiceBarbers] = useState<boolean>(false);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);

  // Update form state helper
  const updateFormState = (updates: Partial<BookingFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

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
        // If no specific services are linked, assume barber can do all active services
        const { data: allServices } = await supabase
          .from('services')
          .select('*')
          .eq('active', true)
          .order('name');
          
        setBarberServices(allServices || []);
      }
    } catch (error) {
      console.error('Error fetching barber services:', error);
      toast.error('Failed to load services for this barber');
      
      // Fallback to all active services
      const { data: allServices } = await supabase
        .from('services')
        .select('*')
        .eq('active', true)
        .order('name');
        
      setBarberServices(allServices || []);
    } finally {
      setIsLoadingBarberServices(false);
    }
  };

  const fetchBarbersForService = async (serviceId: string) => {
    try {
      setIsLoadingServiceBarbers(true);
      
      // Get all barbers that offer this service
      const { data: barberServiceLinks, error: linkError } = await supabase
        .from('barber_services')
        .select('barber_id')
        .eq('service_id', serviceId);
      
      if (linkError) throw linkError;
      
      if (barberServiceLinks && barberServiceLinks.length > 0) {
        const barberIds = barberServiceLinks.map(item => item.barber_id);
        
        // Get details for each barber
        const { data: barberDetails, error: barberError } = await supabase
          .from('barbers')
          .select('*')
          .in('id', barberIds)
          .eq('active', true)
          .order('name');
        
        if (barberError) throw barberError;
        
        setServiceBarbers(barberDetails || []);
      } else {
        // If no specific barbers are linked, assume all active barbers can offer this service
        const { data: allBarbers } = await supabase
          .from('barbers')
          .select('*')
          .eq('active', true)
          .order('name');
          
        setServiceBarbers(allBarbers || []);
      }
    } catch (error) {
      console.error('Error fetching barbers for service:', error);
      toast.error('Failed to load barbers for this service');
      
      // Fallback to all active barbers
      const { data: allBarbers } = await supabase
        .from('barbers')
        .select('*')
        .eq('active', true)
        .order('name');
        
      setServiceBarbers(allBarbers || []);
    } finally {
      setIsLoadingServiceBarbers(false);
    }
  };

  const fetchExistingBookings = async (
    barberId: string,
    date: Date,
    service_id?: string | null
  ) => {
    try {
      setIsLoadingBookings(true);
  
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Check if barber is on holiday for this date
      const isHoliday = await isBarberOnHoliday(barberId, date);
      
      if (isHoliday) {
        toast.error('Barber is on holiday on this date. Please select another date.');
        setExistingBookings([]);
        return;
      }
  
      // Fetch existing bookings for this barber and date
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_time, service_id, services(duration)')
        .eq('barber_id', barberId)
        .eq('booking_date', formattedDate)
        .eq('status', 'confirmed');
  
      if (error) {
        throw error;
      }
  
      console.log('Existing bookings:', data);
      setExistingBookings(data || []);
  
    } catch (error: any) {
      console.error('Error fetching existing bookings:', error);
      toast.error('Failed to load existing bookings');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Effect to fetch existing bookings when date changes
  useEffect(() => {
    if (formState.selectedBarber && formState.selectedDate) {
      fetchExistingBookings(formState.selectedBarber, formState.selectedDate);
    }
  }, [formState.selectedBarber, formState.selectedDate]);

  return {
    formState,
    updateFormState,
    barberServices,
    serviceBarbers,
    isLoadingBarberServices,
    isLoadingServiceBarbers,
    existingBookings,
    isLoadingBookings,
    fetchBarberServices,
    fetchBarbersForService
  };
};
