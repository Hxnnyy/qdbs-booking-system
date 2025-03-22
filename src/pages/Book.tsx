
import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { Spinner } from '@/components/ui/spinner';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import BookingStepIndicator from '@/components/booking/BookingStepIndicator';
import BarberSelectionStep from '@/components/booking/steps/BarberSelectionStep';
import ServiceSelectionStep from '@/components/booking/steps/ServiceSelectionStep';
import DateTimeSelectionStep from '@/components/booking/steps/DateTimeSelectionStep';
import NotesStep from '@/components/booking/steps/NotesStep';
import { useTimeSlots } from '@/hooks/useTimeSlots';

const Book = () => {
  const { barbers, isLoading: barbersLoading } = useBarbers();
  const { services, isLoading: servicesLoading } = useServices();
  const { allEvents, isLoading: calendarLoading } = useCalendarBookings();
  
  const {
    // State
    step,
    selectedBarber,
    barberServices,
    selectedService,
    selectedDate,
    selectedTime,
    notes,
    isLoadingBarberServices,
    existingBookings,
    isLoadingBookings,
    selectedServiceDetails,
    disabledDates,
    isCheckingDates,
    bookingLoading,

    // Setters
    setSelectedDate,
    setSelectedTime,
    setNotes,

    // Functions
    isDateDisabled,
    handleSelectBarber,
    handleSelectService,
    handleBackToBarbers,
    handleBackToServices,
    handleDateTimeComplete,
    handleSubmit
  } = useBookingFlow(barbers, services, allEvents);

  // Use the updated hook directly
  const {
    timeSlots: availableTimeSlots,
    isCalculating: isLoadingTimeSlots,
    error: timeSlotError
  } = useTimeSlots(
    selectedDate,
    selectedBarber,
    selectedServiceDetails,
    existingBookings,
    allEvents
  );

  const isLoading = barbersLoading || servicesLoading || isLoadingBarberServices || isLoadingBookings || calendarLoading;

  // Debug effect to log important data
  useEffect(() => {
    if (selectedService && selectedServiceDetails) {
      console.log('Selected service details:', selectedServiceDetails);
    }
    
    if (availableTimeSlots && availableTimeSlots.length > 0) {
      console.log('Available time slots count in Book.tsx:', availableTimeSlots.length);
    }
    
    if (selectedDate && selectedBarber) {
      console.log('Selected date:', selectedDate);
      console.log('Selected barber:', selectedBarber);
    }
  }, [selectedService, selectedServiceDetails, availableTimeSlots, selectedDate, selectedBarber]);

  const renderStepTitle = () => {
    switch (step) {
      case 'barber':
        return 'Choose Your Barber';
      case 'service':
        return 'Select a Service';
      case 'datetime':
        return 'Pick Date & Time';
      case 'notes':
        return 'Additional Information';
      default:
        return '';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 font-playfair">Book an Appointment</h1>
        <p className="text-muted-foreground mb-8 font-playfair">Follow the steps below to book your next appointment</p>
        
        <BookingStepIndicator currentStep={step} />
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold font-playfair text-center mb-6">{renderStepTitle()}</h2>
            
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
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                onNext={handleDateTimeComplete}
                onBack={handleBackToServices}
                allEvents={allEvents}
                selectedBarberId={selectedBarber}
                serviceDuration={selectedServiceDetails?.duration}
                existingBookings={existingBookings}
                availableTimeSlots={availableTimeSlots}
                isLoadingTimeSlots={isLoadingTimeSlots}
                isCheckingDates={isCheckingDates}
                isDateDisabled={isDateDisabled}
                timeSlotError={timeSlotError}
                onRetry={() => {}} // No need for retry with edge function
              />
            )}
            
            {step === 'notes' && (
              <NotesStep
                notes={notes}
                setNotes={setNotes}
                selectedBarber={selectedBarber}
                selectedService={selectedService}
                selectedDate={selectedDate}
                selectedTime={selectedTime}
                barbers={barbers}
                services={services}
                isLoading={bookingLoading}
                onSubmit={handleSubmit}
                onBack={() => handleBackToServices()}
              />
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Book;
