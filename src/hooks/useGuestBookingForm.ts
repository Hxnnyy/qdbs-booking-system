
import { useState, useEffect } from 'react';
import { format, addDays, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isBarberOnHoliday } from '@/utils/calendarUtils';
import { BookingFormState, ExistingBooking } from '@/types/booking';
import { Service } from '@/supabase-types';

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
  const [isLoadingBarberServices, setIsLoadingBarberServices] = useState<boolean>(false);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);
  const [availableBarbers, setAvailableBarbers] = useState<string[]>([]);

  // Update form state helper
  const updateFormState = (updates: Partial<BookingFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  const fetchBarberServices = async (barberId: string) => {
    try {
      setIsLoadingBarberServices(true);
      
      // Special case for "any barber" - fetch all active services
      if (barberId === 'any') {
        const { data: allServices, error } = await supabase
          .from('services')
          .select('*')
          .eq('active', true)
          .order('name');
          
        if (error) throw error;
        setBarberServices(allServices || []);
        return;
      }
      
      // Regular case - fetch services for specific barber
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

  const fetchExistingBookings = async (
    barberId: string,
    date: Date,
    service_id?: string | null
  ) => {
    try {
      setIsLoadingBookings(true);
  
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // If "any barber" is selected, we don't need to check holidays
      // Instead, we'll fetch all barbers and check availability later
      if (barberId === 'any') {
        // Fetch all active barbers
        const { data: activeBarbers, error: barbersError } = await supabase
          .from('barbers')
          .select('id')
          .eq('active', true);
          
        if (barbersError) throw barbersError;
        
        // Fetch bookings for all barbers on this date
        const { data: allBookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('booking_time, service_id, services(duration), barber_id')
          .eq('booking_date', formattedDate)
          .eq('status', 'confirmed');
          
        if (bookingsError) throw bookingsError;
        
        setExistingBookings(allBookings || []);
        
        // Store the list of active barber IDs for later use
        if (activeBarbers) {
          setAvailableBarbers(activeBarbers.map(b => b.id));
        }
        
        return;
      }
      
      // Regular flow for a specific barber
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
    isLoadingBarberServices,
    existingBookings,
    isLoadingBookings,
    fetchBarberServices,
    availableBarbers
  };
};
