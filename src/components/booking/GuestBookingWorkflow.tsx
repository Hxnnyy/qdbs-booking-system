
import React, { useEffect } from 'react';
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
  // Use the time slots hook with memoized dependencies
  const {
    timeSlots: calculatedTimeSlots,
    isCalculating: isCalculatingTimeSlots,
    error: timeSlotError,
    recalculate: recalculateTimeSlots,
    selectedBarberForBooking
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

  // Use booking workflow with the selectedBarberForBooking passed directly
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
  } = useBookingWorkflow(formState, updateFormState, fetchBarberServices, services, selectedBarberForBooking);

  // When barber or service changes, clear selected time
  useEffect(() => {
    if (formState.selectedBarber || formState.selectedService) {
      updateFormState({ selectedTime: null });
    }
  }, [formState.selectedBarber, formState.selectedService, updateFormState]);

  // When time slots are calculated, check if the currently selected time is still valid
  useEffect(() => {
    if (formState.selectedDate && formState.selectedTime && calculatedTimeSlots.length > 0) {
      // Check if the currently selected time is still available
      if (!calculatedTimeSlots.includes(formState.selectedTime)) {
        updateFormState({ selectedTime: null });
      }
    }
  }, [calculatedTimeSlots, formState.selectedDate, formState.selectedTime, updateFormState]);

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

  // Pass the effective barber ID to the booking step renderer
  const effectiveBarber = formState.selectedBarber === 'any' && selectedBarberForBooking 
    ? selectedBarberForBooking 
    : formState.selectedBarber;

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
        selectedBarberId={effectiveBarber}
        availableTimeSlots={calculatedTimeSlots}
        isLoadingTimeSlots={isCalculatingTimeSlots}
        isCheckingDates={isCheckingDates}
        isDateDisabled={isDateDisabled}
        timeSlotError={timeSlotError}
        onRetryTimeSlots={recalculateTimeSlots}
        showAnyBarberOption={true} // Enable the "any barber" option for guest booking
      />
    </div>
  );
};

export default GuestBookingWorkflow;
