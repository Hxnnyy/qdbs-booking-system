
import React from 'react';
import { BookingStep, BookingFormState } from '@/types/booking';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';
import { isTimeSlotBooked } from '@/utils/bookingUtils';

// Import step components
import BarberSelectionStep from '@/components/booking/steps/BarberSelectionStep';
import ServiceSelectionStep from '@/components/booking/steps/ServiceSelectionStep';
import DateTimeSelectionStep from '@/components/booking/steps/DateTimeSelectionStep';
import GuestInfoStep from '@/components/booking/steps/GuestInfoStep';
import VerifyPhoneStep from '@/components/booking/steps/VerifyPhoneStep';
import NotesAndConfirmationStep from '@/components/booking/steps/NotesAndConfirmationStep';
import ConfirmationStep from '@/components/booking/steps/ConfirmationStep';

interface BookingStepRendererProps {
  step: BookingStep;
  formState: BookingFormState;
  updateFormState: (updates: Partial<BookingFormState>) => void;
  barbers: Barber[];
  services: Service[];
  barberServices: Service[];
  existingBookings: any[];
  bookingLoading: boolean;
  bookingResult: any;
  handlers: {
    handleSelectBarber: (barberId: string) => void;
    handleSelectService: (serviceId: string) => void;
    handleBackToBarbers: () => void;
    handleBackToServices: () => void;
    handleDateTimeComplete: () => void;
    handleBackToDateTime: () => void;
    handleGuestInfoComplete: () => void;
    handleBackToGuestInfo: () => void;
    handleVerificationComplete: () => void;
    handleBackToVerification: () => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
  };
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
  handlers
}) => {
  const checkTimeSlotBooked = (time: string) => {
    return isTimeSlotBooked(time, formState.selectedServiceDetails, existingBookings);
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
          isTimeSlotBooked={checkTimeSlotBooked}
          onNext={handlers.handleDateTimeComplete}
          onBack={handlers.handleBackToServices}
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
          onBack={handlers.handleBackToVerification}
          onNext={() => {}}
        />
      );
      
    case 'confirmation':
      return bookingResult ? (
        <ConfirmationStep 
          bookingResult={bookingResult}
          formData={formState}
          barbers={barbers}
          services={services}
        />
      ) : null;
      
    default:
      return null;
  }
};

export default BookingStepRenderer;
