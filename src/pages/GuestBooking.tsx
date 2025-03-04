
import React from 'react';
import Layout from '@/components/Layout';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useGuestBookingForm } from '@/hooks/useGuestBookingForm';
import StepIndicator from '@/components/booking/StepIndicator';
import GuestBookingWorkflow from '@/components/booking/GuestBookingWorkflow';

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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 font-playfair">Book as Guest</h1>
        <p className="text-muted-foreground mb-8 font-playfair">No account needed - just provide your name and phone number</p>
        
        <StepIndicator currentStep={formState.isPhoneVerified ? 'notes' : formState.selectedTime ? 'guest-info' : formState.selectedService ? 'datetime' : formState.selectedBarber ? 'service' : 'barber'} />
        
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
