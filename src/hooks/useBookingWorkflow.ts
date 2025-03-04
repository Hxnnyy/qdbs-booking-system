import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BookingStep, BookingFormState } from '@/types/booking';
import { useGuestBookings } from '@/hooks/useGuestBookings';
import { Service } from '@/supabase-types';

export const useBookingWorkflow = (
  formState: BookingFormState,
  updateFormState: (updates: Partial<BookingFormState>) => void,
  fetchBarberServices: (barberId: string) => Promise<void>,
  services: Service[]
) => {
  // Initialize step based on form state
  const getInitialStep = (): BookingStep => {
    if (formState.selectedBarber === null) return 'barber';
    if (formState.selectedService === null) return 'service';
    if (formState.selectedDate === undefined || formState.selectedTime === null) return 'datetime';
    if (formState.guestName === '' || formState.guestPhone === '') return 'guest-info';
    if (!formState.isPhoneVerified) return 'verify-phone';
    return 'notes';
  };

  const [step, setStep] = useState<BookingStep>(getInitialStep());
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const { createGuestBooking, isLoading: bookingLoading } = useGuestBookings();

  // Update step when form state changes
  useEffect(() => {
    if (showSuccess) {
      setStep('confirmation');
      return;
    }
    
    if (formState.selectedBarber === null) {
      setStep('barber');
      return;
    }
    
    if (formState.selectedService === null) {
      setStep('service');
      return;
    }
    
    if (formState.selectedDate === undefined || formState.selectedTime === null) {
      setStep('datetime');
      return;
    }
    
    if (formState.guestName === '' || formState.guestPhone === '') {
      setStep('guest-info');
      return;
    }
    
    if (!formState.isPhoneVerified) {
      setStep('verify-phone');
      return;
    }
    
    setStep('notes');
  }, [formState, showSuccess]);

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
    
    // Go to verification step only when the continue button is clicked
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
        updateFormState({ bookingComplete: true });
      }
    } catch (error) {
      console.error('Booking error:', error);
      // Error is already handled in useGuestBookings hook
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
