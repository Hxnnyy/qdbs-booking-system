
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useGuestBookingForm } from '@/hooks/useGuestBookingForm';
import StepIndicator from '@/components/booking/StepIndicator';
import GuestBookingWorkflow from '@/components/booking/GuestBookingWorkflow';
import { BookingStep } from '@/types/booking';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { supabase } from '@/integrations/supabase/client';

const GuestBooking = () => {
  const { barbers, isLoading: barbersLoading } = useBarbers();
  const { services, isLoading: servicesLoading } = useServices();
  const { allEvents, isLoading: calendarLoading } = useCalendarBookings();
  
  const {
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
  } = useGuestBookingForm();

  const isLoading = barbersLoading || servicesLoading || isLoadingBarberServices || isLoadingBookings || calendarLoading || isLoadingServiceBarbers;
  
  const getCurrentStep = (): BookingStep => {
    if (formState.selectedService === null) return 'service';
    if (formState.selectedBarber === null) return 'barber';
    if (formState.selectedDate === undefined || formState.selectedTime === null) return 'datetime';
    if (formState.guestName === '' || formState.guestPhone === '') return 'guest-info';
    if (!formState.isPhoneVerified) return 'verify-phone';
    
    return formState.bookingComplete === true ? 'confirmation' : 'notes';
  };

  // Pre-fetch opening hours for all barbers to speed up loading
  const [barberOpeningHours, setBarberOpeningHours] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchAllBarberOpeningHours = async () => {
      try {
        const { data, error } = await supabase
          .from('opening_hours')
          .select('*')
          .order('barber_id, day_of_week');
          
        if (!error) {
          setBarberOpeningHours(data || []);
        }
      } catch (error) {
        console.error('Error fetching barber opening hours:', error);
      }
    };
    
    fetchAllBarberOpeningHours();
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 font-playfair">Book as Guest</h1>
        <p className="text-muted-foreground mb-8 font-playfair">No account needed - just provide your name and phone number</p>
        
        <StepIndicator currentStep={getCurrentStep()} />
        
        <GuestBookingWorkflow
          barbers={barbers}
          services={services}
          formState={formState}
          updateFormState={updateFormState}
          barberServices={barberServices}
          serviceBarbers={serviceBarbers}
          existingBookings={existingBookings}
          isLoading={isLoading}
          fetchBarberServices={fetchBarberServices}
          fetchBarbersForService={fetchBarbersForService}
          calendarEvents={allEvents}
        />
      </div>
    </Layout>
  );
};

export default GuestBooking;
