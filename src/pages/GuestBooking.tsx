
import React from 'react';
import Layout from '@/components/Layout';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useGuestBookingForm } from '@/hooks/useGuestBookingForm';
import StepIndicator from '@/components/booking/StepIndicator';
import GuestBookingWorkflow from '@/components/booking/GuestBookingWorkflow';
import { BookingStep } from '@/types/booking';

const GuestBooking = () => {
  const { barbers, isLoading: barbersLoading } = useBarbers();
  const { services, isLoading: servicesLoading } = useServices();
  
  const {
    formState,
    updateFormState,
    barberServices,
    isLoadingBarberServices,
    existingBookings,
    isLoadingBookings,
    fetchBarberServices
  } = useGuestBookingForm();

  const isLoading = barbersLoading || servicesLoading || isLoadingBarberServices || isLoadingBookings;
  
  // Determine the current step based on the form state
  const getCurrentStep = (): BookingStep => {
    if (formState.selectedBarber === null) return 'barber';
    if (formState.selectedService === null) return 'service';
    if (formState.selectedDate === undefined || formState.selectedTime === null) return 'datetime';
    if (formState.guestName === '' || formState.guestPhone === '') return 'guest-info';
    if (!formState.isPhoneVerified) return 'verify-phone';
    
    // At this point we have all the info and verified phone, so we're at notes or confirmation
    return formState.notes !== undefined ? 'confirmation' : 'notes';
  };

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
          existingBookings={existingBookings}
          isLoading={isLoading}
          fetchBarberServices={fetchBarberServices}
        />
      </div>
    </Layout>
  );
};

export default GuestBooking;
