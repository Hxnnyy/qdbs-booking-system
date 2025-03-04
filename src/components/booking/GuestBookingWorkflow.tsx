import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { getStepTitle } from '@/utils/bookingUtils';
import { BookingFormState } from '@/types/booking';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';
import BookingStepRenderer from './BookingStepRenderer';
import { useBookingWorkflow } from '@/hooks/useBookingWorkflow';

interface GuestBookingWorkflowProps {
  barbers: Barber[];
  services: Service[];
  formState: BookingFormState;
  updateFormState: (updates: Partial<BookingFormState>) => void;
  barberServices: Service[];
  existingBookings: any[];
  isLoading: boolean;
  fetchBarberServices: (barberId: string) => Promise<void>;
}

const GuestBookingWorkflow: React.FC<GuestBookingWorkflowProps> = ({
  barbers,
  services,
  formState,
  updateFormState,
  barberServices,
  existingBookings,
  isLoading,
  fetchBarberServices
}) => {
  // Import the workflow logic from our custom hook
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

  // Create an object of all the handlers to pass to the step renderer
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
      />
    </div>
  );
};

export default GuestBookingWorkflow;
