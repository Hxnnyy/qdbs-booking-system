
import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { getStepTitle } from '@/utils/bookingUtils';
import { BookingFormState } from '@/types/booking';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';
import BookingStepRenderer from './BookingStepRenderer';
import { useBookingWorkflow } from '@/hooks/useBookingWorkflow';
import { CalendarEvent } from '@/types/calendar';
import { useAvailability } from '@/hooks/useAvailability';

interface GuestBookingWorkflowProps {
  barbers: Barber[];
  services: Service[];
  formState: BookingFormState;
  updateFormState: (updates: Partial<BookingFormState>) => void;
  barberServices: Service[];
  serviceBarbers: Barber[];
  existingBookings: any[];
  isLoading: boolean;
  fetchBarberServices: (barberId: string) => Promise<void>;
  fetchBarbersForService: (serviceId: string) => Promise<void>;
  calendarEvents?: CalendarEvent[];
}

/**
 * GuestBookingWorkflow Component
 * 
 * Manages the guest booking flow including service selection, barber selection,
 * date and time selection, guest information, and confirmation
 */
const GuestBookingWorkflow: React.FC<GuestBookingWorkflowProps> = ({
  barbers,
  services,
  formState,
  updateFormState,
  barberServices,
  serviceBarbers,
  existingBookings,
  isLoading,
  fetchBarberServices,
  fetchBarbersForService,
  calendarEvents = []
}) => {
  const {
    step,
    showSuccess,
    bookingResult,
    bookingLoading,
    handleSelectService,
    handleSelectBarber,
    handleBackToServices,
    handleBackToBarbers,
    handleDateTimeComplete,
    handleBackToDateTime,
    handleGuestInfoComplete,
    handleBackToGuestInfo,
    handleVerificationComplete,
    handleBackToVerification,
    handleSubmit
  } = useBookingWorkflow(formState, updateFormState, fetchBarberServices, services, fetchBarbersForService);

  // Use our new availability hook
  const {
    availableTimeSlots,
    isLoadingTimeSlots,
    timeSlotError,
    isCheckingDates,
    isDateDisabled,
    refreshAvailability
  } = useAvailability(
    formState.selectedDate,
    formState.selectedBarber,
    formState.selectedServiceDetails,
    calendarEvents
  );

  const handlers = {
    handleSelectService,
    handleSelectBarber,
    handleBackToServices,
    handleBackToBarbers,
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
        serviceBarbers={serviceBarbers}
        existingBookings={existingBookings}
        bookingLoading={bookingLoading}
        bookingResult={bookingResult}
        handlers={handlers}
        allEvents={calendarEvents}
        selectedBarberId={formState.selectedBarber}
        availableTimeSlots={availableTimeSlots}
        isLoadingTimeSlots={isLoadingTimeSlots}
        isCheckingDates={isCheckingDates}
        isDateDisabled={isDateDisabled}
        timeSlotError={timeSlotError}
        onRetry={refreshAvailability}
      />
    </div>
  );
};

export default GuestBookingWorkflow;
