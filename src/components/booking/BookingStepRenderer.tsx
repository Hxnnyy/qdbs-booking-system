
import React from 'react';
import { BookingStep, BookingFormState, BookingStepHandlers, BookingResult } from '@/types/booking';
import BarberSelectionStep from './steps/BarberSelectionStep';
import ServiceSelectionStep from './steps/ServiceSelectionStep';
import DateTimeSelectionStep from './steps/DateTimeSelectionStep';
import GuestInfoStep from './steps/GuestInfoStep';
import VerifyPhoneStep from './steps/VerifyPhoneStep';
import NotesAndConfirmationStep from './steps/NotesAndConfirmationStep';
import ConfirmationStep from './steps/ConfirmationStep';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';
import { CalendarEvent } from '@/types/calendar';

interface BookingStepRendererProps {
  step: BookingStep;
  formState: BookingFormState;
  updateFormState: (updates: Partial<BookingFormState>) => void;
  barbers: Barber[];
  services: Service[];
  barberServices: Service[];
  existingBookings: any[];
  bookingLoading: boolean;
  bookingResult: BookingResult | null;
  handlers: BookingStepHandlers;
  allEvents?: CalendarEvent[];
  selectedBarberId?: string | null;
  availableTimeSlots: string[];
  isLoadingTimeSlots: boolean;
  isCheckingDates: boolean;
  isDateDisabled: (date: Date) => boolean;
  timeSlotError?: string | null;
}

const BookingStepRenderer: React.FC<BookingStepRendererProps> = ({
  step,
  formState,
  updateFormState,
  barbers,
  services,
  barberServices,
  existingBookings,
  bookingLoading,
  bookingResult,
  handlers,
  allEvents = [],
  selectedBarberId,
  availableTimeSlots = [],
  isLoadingTimeSlots = false,
  isCheckingDates = false,
  isDateDisabled = () => false,
  timeSlotError = null
}) => {
  // Get the selected service duration
  const getServiceDuration = (): number => {
    if (formState.selectedServiceDetails) {
      return formState.selectedServiceDetails.duration;
    }
    
    if (formState.selectedService) {
      const service = services.find(s => s.id === formState.selectedService);
      return service?.duration || 60; // Default to 60 if not found
    }
    
    return 60; // Default duration
  };

  switch (step) {
    case 'barber':
      return (
        <BarberSelectionStep
          barbers={barbers}
          onSelectBarber={handlers.handleSelectBarber}
          onNext={() => {}}
        />
      );
    case 'service':
      return (
        <ServiceSelectionStep
          services={barberServices}
          onSelectService={handlers.handleSelectService}
          onBack={handlers.handleBackToBarbers}
          onNext={() => {}}
        />
      );
    case 'datetime':
      return (
        <DateTimeSelectionStep
          selectedDate={formState.selectedDate}
          setSelectedDate={(date) => updateFormState({ selectedDate: date })}
          selectedTime={formState.selectedTime}
          setSelectedTime={(time) => updateFormState({ selectedTime: time })}
          onNext={handlers.handleDateTimeComplete}
          onBack={handlers.handleBackToServices}
          allEvents={allEvents}
          selectedBarberId={selectedBarberId}
          serviceDuration={getServiceDuration()}
          existingBookings={existingBookings}
          availableTimeSlots={availableTimeSlots}
          isLoadingTimeSlots={isLoadingTimeSlots}
          isCheckingDates={isCheckingDates}
          isDateDisabled={isDateDisabled}
          timeSlotError={timeSlotError}
        />
      );
    case 'guest-info':
      return (
        <GuestInfoStep
          guestName={formState.guestName}
          setGuestName={(name) => updateFormState({ guestName: name })}
          guestPhone={formState.guestPhone}
          setGuestPhone={(phone) => updateFormState({ guestPhone: phone })}
          guestEmail={formState.guestEmail}
          setGuestEmail={(email) => updateFormState({ guestEmail: email })}
          onNext={handlers.handleGuestInfoComplete}
          onBack={handlers.handleBackToDateTime}
        />
      );
    case 'verify-phone':
      return (
        <VerifyPhoneStep
          phone={formState.guestPhone}
          isVerified={formState.isPhoneVerified}
          setIsVerified={(verified) => updateFormState({ isPhoneVerified: verified })}
          onNext={handlers.handleVerificationComplete}
          onBack={handlers.handleBackToGuestInfo}
        />
      );
    case 'notes':
      return (
        <NotesAndConfirmationStep
          notes={formState.notes}
          setNotes={(notes) => updateFormState({ notes: notes })}
          formData={formState}
          barbers={barbers}
          services={services}
          isLoading={bookingLoading}
          onSubmit={handlers.handleSubmit}
          onBack={handlers.handleBackToGuestInfo}
          onNext={() => {}}
        />
      );
    case 'confirmation':
      if (!bookingResult) {
        return <div>Loading confirmation...</div>;
      }
      return (
        <ConfirmationStep
          bookingResult={bookingResult}
          formData={formState}
          barbers={barbers}
          services={services}
          onNext={() => {}}
        />
      );
    default:
      return <div>Unknown step</div>;
  }
};

export default BookingStepRenderer;
