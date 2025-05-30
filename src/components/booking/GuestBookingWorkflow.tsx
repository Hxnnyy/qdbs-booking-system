
import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { getStepTitle } from '@/utils/bookingUtils';
import { BookingFormState } from '@/types/booking';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';
import BookingStepRenderer from './BookingStepRenderer';
import { useBookingWorkflow } from '@/hooks/useBookingWorkflow';
import { CalendarEvent } from '@/types/calendar';
import { useTimeSlots } from '@/hooks/useTimeSlots';
import { useDateAvailability } from '@/hooks/useDateAvailability';

interface GuestBookingWorkflowProps {
  barbers: Barber[];
  services: Service[];
  formState: BookingFormState;
  updateFormState: (updates: Partial<BookingFormState>) => void;
  barberServices: Service[];
  existingBookings: any[];
  isLoading: boolean;
  fetchBarberServices: (barberId: string) => Promise<void>;
  calendarEvents?: CalendarEvent[];
}

/**
 * GuestBookingWorkflow Component
 * 
 * Manages the guest booking flow including barber selection, service selection,
 * date and time selection, guest information, and confirmation
 */
const GuestBookingWorkflow: React.FC<GuestBookingWorkflowProps> = ({
  barbers,
  services,
  formState,
  updateFormState,
  barberServices,
  existingBookings,
  isLoading,
  fetchBarberServices,
  calendarEvents = []
}) => {
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

  // Use the time slots hook
  const {
    timeSlots: calculatedTimeSlots,
    isCalculating: isCalculatingTimeSlots,
    error: timeSlotError
  } = useTimeSlots(
    formState.selectedDate,
    formState.selectedBarber,
    formState.selectedServiceDetails,
    existingBookings,
    calendarEvents
  );

  // Use the date availability hook
  const {
    isCheckingDates,
    isDateDisabled
  } = useDateAvailability(
    formState.selectedBarber,
    formState.selectedServiceDetails?.duration,
    calendarEvents,
    existingBookings
  );

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
        allEvents={calendarEvents}
        selectedBarberId={formState.selectedBarber}
        availableTimeSlots={calculatedTimeSlots}
        isLoadingTimeSlots={isCalculatingTimeSlots}
        isCheckingDates={isCheckingDates}
        isDateDisabled={isDateDisabled}
        timeSlotError={timeSlotError}
      />
    </div>
  );
};

export default GuestBookingWorkflow;
