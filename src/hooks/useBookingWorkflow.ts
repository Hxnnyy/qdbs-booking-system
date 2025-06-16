
import { useState } from 'react';
import { useCreateGuestBooking } from './useCreateGuestBooking';
import { BookingFormState, BookingStep, BookingResult } from '@/types/booking';
import { Service } from '@/supabase-types';
import { toast } from 'sonner';

export const useBookingWorkflow = (
  formState: BookingFormState,
  updateFormState: (updates: Partial<BookingFormState>) => void,
  fetchBarberServices: (barberId: string) => Promise<void>,
  services: Service[]
) => {
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const { createGuestBooking, isLoading: bookingLoading } = useCreateGuestBooking();

  const getCurrentStep = (): BookingStep => {
    if (formState.selectedBarber === null) return 'barber';
    if (formState.selectedService === null) return 'service';
    if (formState.selectedDate === undefined || formState.selectedTime === null) return 'datetime';
    if (formState.guestName === '' || formState.guestPhone === '') return 'guest-info';
    if (!formState.isPhoneVerified) return 'verify-phone';
    
    return formState.bookingComplete === true ? 'confirmation' : 'notes';
  };

  const step = getCurrentStep();

  const handleSelectBarber = async (barberId: string) => {
    updateFormState({ 
      selectedBarber: barberId,
      selectedService: null,
      selectedServiceDetails: undefined
    });
    await fetchBarberServices(barberId);
  };

  const handleSelectService = (serviceId: string) => {
    const serviceDetails = services.find(s => s.id === serviceId);
    updateFormState({ 
      selectedService: serviceId,
      selectedServiceDetails: serviceDetails
    });
  };

  const handleBackToBarbers = () => {
    updateFormState({ 
      selectedBarber: null,
      selectedService: null,
      selectedServiceDetails: undefined
    });
  };

  const handleBackToServices = () => {
    updateFormState({ 
      selectedService: null,
      selectedServiceDetails: undefined
    });
  };

  const handleDateTimeComplete = () => {
    // Just move to the next step - the step calculation will handle this
  };

  const handleBackToDateTime = () => {
    updateFormState({
      selectedDate: undefined,
      selectedTime: null
    });
  };

  const handleGuestInfoComplete = () => {
    // Just move to the next step - the step calculation will handle this
  };

  const handleBackToGuestInfo = () => {
    updateFormState({
      guestName: '',
      guestPhone: '',
      guestEmail: '',
      isPhoneVerified: false
    });
  };

  const handleVerificationComplete = () => {
    // Just move to the next step - the step calculation will handle this
  };

  const handleBackToVerification = () => {
    updateFormState({
      isPhoneVerified: false
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formState.selectedBarber || !formState.selectedService || !formState.selectedDate || !formState.selectedTime) {
        toast.error('Please complete all required fields');
        return;
      }

      console.log('Submitting guest booking - should only send email confirmation');
      
      const bookingData = {
        barber_id: formState.selectedBarber,
        service_id: formState.selectedService,
        booking_date: formState.selectedDate.toISOString().split('T')[0],
        booking_time: formState.selectedTime,
        guest_name: formState.guestName,
        guest_phone: formState.guestPhone,
        guest_email: formState.guestEmail,
        notes: formState.notes
      };

      // This should only send email confirmation, no SMS
      const result = await createGuestBooking(bookingData);
      
      // Transform GuestBookingResult to BookingResult format
      const transformedResult: BookingResult = {
        id: result.bookingData.id,
        bookingCode: result.bookingCode,
        twilioResult: result.twilioResult,
        ...result.bookingData
      };
      
      setBookingResult(transformedResult);
      updateFormState({ bookingComplete: true });
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Booking submission error:', error);
      toast.error('Failed to create booking. Please try again.');
    }
  };

  return {
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
  };
};
