
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
          selectedBarber={formState.selectedBarber}
          onSelectBarber={handlers.handleSelectBarber}
        />
      );
    case 'service':
      return (
        <ServiceSelectionStep
          services={barberServices}
          selectedService={formState.selectedService}
          onSelectService={handlers.handleSelectService}
          onBack={handlers.handleBackToBarbers}
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
          guestEmail={formState.guestEmail}
          setGuestEmail={(email) => updateFormState({ guestEmail: email })}
          onNext={handlers.handleGuestInfoComplete}
          onBack={handlers.handleBackToDateTime}
        />
      );
    case 'verify-phone':
      return (
        <VerifyPhoneStep
          phoneNumber={formState.guestPhone}
          verificationId={formState.verificationId}
          onComplete={handlers.handleVerificationComplete}
          onBack={handlers.handleBackToGuestInfo}
        />
      );
    case 'notes':
      return (
        <NotesAndConfirmationStep
          notes={formState.notes}
          setNotes={(notes) => updateFormState({ notes: notes })}
          selectedBarber={barbers.find(b => b.id === formState.selectedBarber)}
          selectedService={services.find(s => s.id === formState.selectedService)}
          selectedDate={formState.selectedDate}
          selectedTime={formState.selectedTime}
          onSubmit={handlers.handleSubmit}
          onBack={handlers.handleBackToGuestInfo}
          isLoading={bookingLoading}
        />
      );
    case 'confirmation':
      return (
        <ConfirmationStep
          bookingResult={bookingResult}
        />
      );
    default:
      return <div>Unknown step</div>;
  }
};

export default BookingStepRenderer;
