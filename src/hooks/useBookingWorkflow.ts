import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { BookingStep, BookingFormState } from '@/types/booking';
import { useGuestBookings } from '@/hooks/useGuestBookings';
import { Service } from '@/supabase-types';
import { supabase } from '@/integrations/supabase/client';

export const useBookingWorkflow = (
  formState: BookingFormState,
  updateFormState: (updates: Partial<BookingFormState>) => void,
  fetchBarberServices: (barberId: string) => Promise<void>,
  services: Service[]
) => {
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
    
    if ((formState.guestName === '' || formState.guestPhone === '') && 
        step !== 'verify-phone' && step !== 'notes' && step !== 'confirmation') {
      setStep('guest-info');
      return;
    }
    
    if (!formState.isPhoneVerified && step === 'verify-phone') {
      return;
    }
    
    if (formState.isPhoneVerified && 
        (step === 'verify-phone' || step === 'notes' || step === 'confirmation')) {
      setStep('notes');
    }
  }, [formState, showSuccess, step]);

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
    
    if (!formState.guestEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.guestEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(formState.guestPhone.replace(/\s+/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
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
    const { selectedBarber, selectedService, selectedDate, selectedTime, guestName, guestPhone, guestEmail, notes, isPhoneVerified } = formState;

    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime || !guestName || !guestPhone || !guestEmail) {
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
        guest_email: guestEmail,
        notes: notes.trim() || undefined
      });

      if (result) {
        console.log('Booking created successfully:', result);
        
        const { data: barberData } = await supabase
          .from('barbers')
          .select('name')
          .eq('id', selectedBarber)
          .single();
          
        const { data: serviceData } = await supabase
          .from('services')
          .select('name')
          .eq('id', selectedService)
          .single();
          
        try {
          const { data: emailResult, error: emailError } = await supabase.functions.invoke('send-booking-email', {
            body: {
              to: guestEmail,
              name: guestName,
              bookingCode: result.bookingCode,
              bookingId: result.id,
              bookingDate: formattedDate,
              bookingTime: selectedTime,
              barberName: barberData?.name || 'Your Barber',
              serviceName: serviceData?.name || 'Your Service',
              isGuest: true
            }
          });
          
          if (emailError) {
            console.error('Error sending confirmation email:', emailError);
          } else {
            console.log('Confirmation email sent successfully:', emailResult);
          }
        } catch (emailError) {
          console.error('Failed to send confirmation email:', emailError);
        }
        
        try {
          const { data: smsData, error: smsError } = await supabase.functions.invoke('send-booking-sms', {
            body: {
              phone: guestPhone,
              name: guestName,
              bookingCode: result.bookingCode,
              bookingId: result.id,
              bookingDate: formattedDate,
              bookingTime: selectedTime,
              barberName: barberData?.name || '',
              serviceName: serviceData?.name || ''
            }
          });
          
          console.log('SMS notification result:', smsData);
          
          const bookingDetails = {
            id: result.id,
            bookingCode: result.bookingCode,
            twilioResult: smsData
          };
          
          setBookingResult(bookingDetails);
        } catch (smsError) {
          console.error('Failed to send confirmation SMS:', smsError);
          setBookingResult({
            id: result.id,
            bookingCode: result.bookingCode,
            twilioResult: { success: false, message: 'Failed to send SMS notification' }
          });
        }
        
        setShowSuccess(true);
        setStep('confirmation');
        updateFormState({ bookingComplete: true });
      }
    } catch (error) {
      console.error('Booking error:', error);
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
