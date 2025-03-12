
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
  selectedBarberId?: string;
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
  selectedBarberId
}) => {
  const isTimeSlotBooked = (time: string) => {
    if (!formState.selectedDate) return false;
    
    const formattedDate = formState.selectedDate.toISOString().split('T')[0];
    
    return existingBookings.some(booking => {
      return (
        booking.booking_date === formattedDate &&
        booking.booking_time === time &&
        booking.barber_id === formState.selectedBarber
      );
    });
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
          isTimeSlotBooked={isTimeSlotBooked}
          onNext={handlers.handleDateTimeComplete}
          onBack={handlers.handleBackToServices}
          allEvents={allEvents}
          selectedBarberId={selectedBarberId}
        />
      );
    case 'guest-info':
      return (
        <GuestInfoStep
          guestName={formState.guestName}
          setGuestName={(name) => updateFormState({ guestName: name })}
          guestPhone={formState.guestPhone}
          setGuestPhone={(phone) => updateFormState({ guestPhone: phone })}
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
          onComplete={handlers.handleVerificationComplete}
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
        />
      );
    default:
      return <div>Unknown step</div>;
  }
};

export default BookingStepRenderer;
