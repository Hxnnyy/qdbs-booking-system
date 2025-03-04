
import React, { useState } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';
import { BookingStep, BookingFormState } from '@/types/booking';
import { isTimeSlotBooked, getStepTitle } from '@/utils/bookingUtils';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';
import { useGuestBookings } from '@/hooks/useGuestBookings';

// Import step components
import StepIndicator from '@/components/booking/StepIndicator';
import BarberSelectionStep from '@/components/booking/steps/BarberSelectionStep';
import ServiceSelectionStep from '@/components/booking/steps/ServiceSelectionStep';
import DateTimeSelectionStep from '@/components/booking/steps/DateTimeSelectionStep';
import GuestInfoStep from '@/components/booking/steps/GuestInfoStep';
import VerifyPhoneStep from '@/components/booking/steps/VerifyPhoneStep';
import NotesAndConfirmationStep from '@/components/booking/steps/NotesAndConfirmationStep';
import ConfirmationStep from '@/components/booking/steps/ConfirmationStep';

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
  const [step, setStep] = useState<BookingStep>('barber');
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const { createGuestBooking, isLoading: bookingLoading } = useGuestBookings();

  // Step handlers
  const handleSelectBarber = (barberId: string) => {
    updateFormState({ selectedBarber: barberId, selectedService: null, selectedServiceDetails: null });
    fetchBarberServices(barberId);
    setStep('service');
  };

  const handleSelectService = (serviceId: string) => {
    const serviceDetails = services.find(s => s.id === serviceId) || null;
    updateFormState({ selectedService: serviceId, selectedServiceDetails: serviceDetails });
    setStep('datetime');
  };

  const handleBackToBarbers = () => {
    setStep('barber');
    updateFormState({ 
      selectedBarber: null, 
      selectedService: null, 
      selectedServiceDetails: null 
    });
  };

  const handleBackToServices = () => {
    setStep('service');
    updateFormState({ 
      selectedService: null, 
      selectedServiceDetails: null, 
      selectedDate: undefined, 
      selectedTime: null 
    });
  };

  const handleDateTimeComplete = () => {
    if (formState.selectedDate && formState.selectedTime) {
      setStep('guest-info');
    } else {
      toast.error('Please select both date and time');
    }
  };

  const handleBackToDateTime = () => {
    setStep('datetime');
  };

  const handleGuestInfoComplete = () => {
    if (!formState.guestName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!formState.guestPhone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    
    // Simple phone validation
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(formState.guestPhone.replace(/\s+/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    // Go to verification step
    setStep('verify-phone');
  };

  const handleBackToGuestInfo = () => {
    setStep('guest-info');
  };

  const handleVerificationComplete = () => {
    setStep('notes');
  };

  const handleBackToVerification = () => {
    setStep('verify-phone');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { selectedBarber, selectedService, selectedDate, selectedTime, guestName, guestPhone, notes, isPhoneVerified } = formState;

    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime || !guestName || !guestPhone) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isPhoneVerified) {
      toast.error('Phone verification is required');
      setStep('verify-phone');
      return;
    }

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      const result = await createGuestBooking({
        barber_id: selectedBarber,
        service_id: selectedService,
        booking_date: formattedDate,
        booking_time: selectedTime,
        guest_name: guestName,
        guest_phone: guestPhone,
        notes: notes.trim() || undefined
      });

      if (result) {
        setBookingResult(result);
        setShowSuccess(true);
        setStep('confirmation');
      }
    } catch (error) {
      console.error('Booking error:', error);
      // Error is already handled in useGuestBookings hook
    }
  };

  const checkTimeSlotBooked = (time: string) => {
    return isTimeSlotBooked(time, formState.selectedServiceDetails, existingBookings);
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
      
      {step === 'barber' && (
        <BarberSelectionStep 
          barbers={barbers} 
          onSelectBarber={handleSelectBarber} 
          onNext={() => {}} 
        />
      )}
      
      {step === 'service' && (
        <ServiceSelectionStep 
          services={barberServices} 
          onSelectService={handleSelectService} 
          onBack={handleBackToBarbers} 
          onNext={() => {}} 
        />
      )}
      
      {step === 'datetime' && (
        <DateTimeSelectionStep 
          selectedDate={formState.selectedDate}
          setSelectedDate={(date) => updateFormState({ selectedDate: date })}
          selectedTime={formState.selectedTime}
          setSelectedTime={(time) => updateFormState({ selectedTime: time })}
          isTimeSlotBooked={checkTimeSlotBooked}
          onNext={handleDateTimeComplete}
          onBack={handleBackToServices}
        />
      )}
      
      {step === 'guest-info' && (
        <GuestInfoStep 
          guestName={formState.guestName}
          setGuestName={(name) => updateFormState({ guestName: name })}
          guestPhone={formState.guestPhone}
          setGuestPhone={(phone) => updateFormState({ guestPhone: phone })}
          onNext={handleGuestInfoComplete}
          onBack={handleBackToDateTime}
        />
      )}

      {step === 'verify-phone' && (
        <VerifyPhoneStep 
          phone={formState.guestPhone}
          isVerified={formState.isPhoneVerified}
          setIsVerified={(verified) => updateFormState({ isPhoneVerified: verified })}
          onNext={handleVerificationComplete}
          onBack={handleBackToGuestInfo}
        />
      )}
      
      {step === 'notes' && (
        <NotesAndConfirmationStep 
          notes={formState.notes}
          setNotes={(notes) => updateFormState({ notes: notes })}
          formData={formState}
          barbers={barbers}
          services={services}
          isLoading={bookingLoading}
          onSubmit={handleSubmit}
          onBack={handleBackToVerification}
          onNext={() => {}}
        />
      )}
      
      {step === 'confirmation' && bookingResult && (
        <ConfirmationStep 
          bookingResult={bookingResult}
          formData={formState}
          barbers={barbers}
          services={services}
        />
      )}
    </div>
  );
};

export default GuestBookingWorkflow;
