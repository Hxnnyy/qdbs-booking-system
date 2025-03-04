
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useGuestBookings } from '@/hooks/useGuestBookings';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/supabase-types';
import { BookingStep, BookingFormState, ExistingBooking } from '@/types/booking';
import { isTimeSlotBooked, getStepTitle } from '@/utils/bookingUtils';

// Import step components
import StepIndicator from '@/components/booking/StepIndicator';
import BarberSelectionStep from '@/components/booking/steps/BarberSelectionStep';
import ServiceSelectionStep from '@/components/booking/steps/ServiceSelectionStep';
import DateTimeSelectionStep from '@/components/booking/steps/DateTimeSelectionStep';
import GuestInfoStep from '@/components/booking/steps/GuestInfoStep';
import VerifyPhoneStep from '@/components/booking/steps/VerifyPhoneStep';
import NotesAndConfirmationStep from '@/components/booking/steps/NotesAndConfirmationStep';
import ConfirmationStep from '@/components/booking/steps/ConfirmationStep';

const GuestBooking = () => {
  const { barbers, isLoading: barbersLoading } = useBarbers();
  const { services, isLoading: servicesLoading } = useServices();
  const { createGuestBooking, isLoading: bookingLoading } = useGuestBookings();

  // Form state
  const [formState, setFormState] = useState<BookingFormState>({
    selectedBarber: null,
    selectedService: null,
    selectedDate: undefined,
    selectedTime: null,
    guestName: '',
    guestPhone: '',
    notes: '',
    selectedServiceDetails: null,
    isPhoneVerified: false
  });

  // UI state
  const [step, setStep] = useState<BookingStep>('barber');
  const [barberServices, setBarberServices] = useState<Service[]>([]);
  const [isLoadingBarberServices, setIsLoadingBarberServices] = useState<boolean>(false);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  const isLoading = barbersLoading || servicesLoading || bookingLoading || isLoadingBarberServices || isLoadingBookings;

  // Update form state helper
  const updateFormState = (updates: Partial<BookingFormState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  const fetchBarberServices = async (barberId: string) => {
    try {
      setIsLoadingBarberServices(true);
      
      const { data: barberServiceLinks, error: barberServicesError } = await supabase
        .from('barber_services')
        .select('service_id')
        .eq('barber_id', barberId);
      
      if (barberServicesError) throw barberServicesError;
      
      if (barberServiceLinks && barberServiceLinks.length > 0) {
        const serviceIds = barberServiceLinks.map(item => item.service_id);
        
        const { data: serviceDetails, error: serviceDetailsError } = await supabase
          .from('services')
          .select('*')
          .in('id', serviceIds)
          .eq('active', true)
          .order('name');
        
        if (serviceDetailsError) throw serviceDetailsError;
        
        setBarberServices(serviceDetails || []);
      } else {
        setBarberServices(services.filter(service => service.active));
      }
    } catch (error) {
      console.error('Error fetching barber services:', error);
      toast.error('Failed to load services for this barber');
      setBarberServices(services.filter(service => service.active));
    } finally {
      setIsLoadingBarberServices(false);
    }
  };

  const fetchExistingBookings = async (barberId: string, date: Date) => {
    try {
      setIsLoadingBookings(true);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_time, service_id, services(duration)')
        .eq('barber_id', barberId)
        .eq('booking_date', formattedDate)
        .eq('status', 'confirmed')
        .order('booking_time');
      
      if (error) throw error;
      
      setExistingBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load existing bookings');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Effect to fetch existing bookings when date changes
  useEffect(() => {
    if (formState.selectedBarber && formState.selectedDate) {
      fetchExistingBookings(formState.selectedBarber, formState.selectedDate);
    }
  }, [formState.selectedBarber, formState.selectedDate]);

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
    
    // Go to verification step instead of notes
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 font-playfair">Book as Guest</h1>
        <p className="text-muted-foreground mb-8 font-playfair">No account needed - just provide your name and phone number</p>
        
        <StepIndicator currentStep={step} />
        
        {isLoading && !showSuccess ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
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
        )}
      </div>
    </Layout>
  );
};

export default GuestBooking;
