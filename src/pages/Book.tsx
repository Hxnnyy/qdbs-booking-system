
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useBookings } from '@/hooks/useBookings';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { format, addDays, isBefore, startOfToday, addMonths } from 'date-fns';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Scissors, Clock, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/supabase-types';
import { useCalendarBookings } from '@/hooks/useCalendarBookings';
import { isBarberHolidayDate } from '@/utils/holidayIndicatorUtils';
import { isWithinOpeningHours, isTimeSlotBooked, hasAvailableSlotsOnDay } from '@/utils/bookingUtils';
import TimeSlot from '@/components/booking/TimeSlot';
import { ExistingBooking } from '@/types/booking';

const Book = () => {
  const navigate = useNavigate();
  const { barbers, isLoading: barbersLoading } = useBarbers();
  const { services, isLoading: servicesLoading } = useServices();
  const { createBooking, isLoading: bookingLoading } = useBookings();
  const { user } = useAuth();
  const { allEvents, isLoading: calendarLoading } = useCalendarBookings();

  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [barberServices, setBarberServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [step, setStep] = useState<'barber' | 'service' | 'datetime' | 'notes'>('barber');
  const [isLoadingBarberServices, setIsLoadingBarberServices] = useState<boolean>(false);
  const [existingBookings, setExistingBookings] = useState<ExistingBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<Service | null>(null);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState<boolean>(false);
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [isCheckingDates, setIsCheckingDates] = useState<boolean>(false);

  const today = startOfToday();
  const maxDate = addMonths(today, 6);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  const isLoading = barbersLoading || servicesLoading || bookingLoading || isLoadingBarberServices || isLoadingBookings || calendarLoading;

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
      
      const isHoliday = isBarberHolidayDate(allEvents, date, barberId);
      
      if (isHoliday) {
        toast.error('Barber is on holiday on this date. Please select another date.');
        setExistingBookings([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('bookings')
        .select('booking_time, service_id, services(duration)')
        .eq('barber_id', barberId)
        .eq('booking_date', formattedDate)
        .eq('status', 'confirmed')
        .order('booking_time');
      
      if (error) throw error;
      
      console.log('Existing bookings:', data);
      setExistingBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load existing bookings');
    } finally {
      setIsLoadingBookings(false);
    }
  };

  // Function to check if a date should be disabled
  const shouldDisableDate = (date: Date) => {
    if (isBefore(date, today) || isBefore(maxDate, date)) {
      return true;
    }
    
    if (selectedBarber) {
      return isBarberHolidayDate(allEvents, date, selectedBarber);
    }
    
    return false;
  };

  const isDateDisabled = (date: Date) => {
    // Basic checks first
    if (shouldDisableDate(date)) {
      return true;
    }
    
    // Then check our pre-computed unavailable days
    return disabledDates.some(disabledDate => 
      disabledDate.getDate() === date.getDate() && 
      disabledDate.getMonth() === date.getMonth() && 
      disabledDate.getFullYear() === date.getFullYear()
    );
  };

  const handleSelectBarber = (barberId: string) => {
    const selectedBarber = barbers.find(b => b.id === barberId);
    if (!selectedBarber || !selectedBarber.active) {
      toast.error("This barber is currently unavailable");
      return;
    }
    
    setSelectedBarber(barberId);
    setSelectedService(null);
    setSelectedServiceDetails(null);
    fetchBarberServices(barberId);
    setStep('service');
  };

  const handleSelectService = (serviceId: string) => {
    setSelectedService(serviceId);
    const serviceDetails = services.find(s => s.id === serviceId) || null;
    setSelectedServiceDetails(serviceDetails);
    setStep('datetime');
  };

  const handleBackToBarbers = () => {
    setStep('barber');
    setSelectedBarber(null);
    setSelectedService(null);
    setSelectedServiceDetails(null);
  };

  const handleBackToServices = () => {
    setStep('service');
    setSelectedService(null);
    setSelectedServiceDetails(null);
    setSelectedDate(undefined);
    setSelectedTime(null);
  };

  const handleDateTimeComplete = () => {
    if (selectedDate && selectedTime) {
      setStep('notes');
    } else {
      toast.error('Please select both date and time');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in to book an appointment');
      navigate('/login');
      return;
    }

    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      
      // Final check for barber availability
      const isHoliday = isBarberHolidayDate(allEvents, selectedDate, selectedBarber);
      if (isHoliday) {
        toast.error('Cannot book on this date as the barber is on holiday');
        return;
      }
      
      // Final check for time slot availability
      const currentBookingTimeSlotAvailable = availableTimeSlots.includes(selectedTime);
      if (!currentBookingTimeSlotAvailable) {
        toast.error('The selected time is no longer available. Please choose another time.');
        return;
      }

      const result = await createBooking({
        barber_id: selectedBarber,
        service_id: selectedService,
        booking_date: formattedDate,
        booking_time: selectedTime,
        notes: notes.trim() || null
      });

      if (result) {
        toast.success('Booking created successfully!');
        navigate('/profile');
      }
    } catch (error) {
      console.error('Booking error:', error);
      // Error is already handled in useBookings hook
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'barber' 
            ? 'bg-burgundy text-white' 
            : step === 'service' || step === 'datetime' || step === 'notes' 
              ? 'bg-burgundy text-white' 
              : 'bg-gray-200 text-gray-600'
        }`}>1</div>
        
        <div className={`h-1 w-12 ${
          step === 'service' || step === 'datetime' || step === 'notes' 
            ? 'bg-burgundy' 
            : 'bg-gray-200'
        }`}></div>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'service' 
            ? 'bg-burgundy text-white' 
            : step === 'datetime' || step === 'notes' 
              ? 'bg-burgundy text-white' 
              : 'bg-gray-200 text-gray-600'
        }`}>2</div>
        
        <div className={`h-1 w-12 ${
          step === 'datetime' || step === 'notes' 
            ? 'bg-burgundy' 
            : 'bg-gray-200'
        }`}></div>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'datetime' 
            ? 'bg-burgundy text-white' 
            : step === 'notes' 
              ? 'bg-burgundy text-white' 
              : 'bg-gray-200 text-gray-600'
        }`}>3</div>
        
        <div className={`h-1 w-12 ${
          step === 'notes' 
            ? 'bg-burgundy' 
            : 'bg-gray-200'
        }`}></div>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'notes' 
            ? 'bg-burgundy text-white' 
            : 'bg-gray-200 text-gray-600'
        }`}>4</div>
      </div>
    );
  };

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

  // Pre-check available days for the selected month
  useEffect(() => {
    const checkMonthAvailability = async () => {
      if (!selectedBarber || !selectedServiceDetails) return;
      
      setIsCheckingDates(true);
      
      try {
        // Generate dates for current month view
        const daysToCheck = [];
        const currentDate = new Date(today);
        
        // Check next 30 days
        for (let i = 0; i < 30; i++) {
          const dateToCheck = new Date(currentDate);
          dateToCheck.setDate(currentDate.getDate() + i);
          
          if (!shouldDisableDate(dateToCheck)) {
            daysToCheck.push(dateToCheck);
          }
        }
        
        // Check each date for availability
        const unavailableDays = [];
        
        for (const date of daysToCheck) {
          const hasSlots = await hasAvailableSlotsOnDay(
            selectedBarber, 
            date, 
            existingBookings,
            selectedServiceDetails.duration
          );
          
          if (!hasSlots) {
            unavailableDays.push(date);
          }
        }
        
        setDisabledDates(unavailableDays);
      } catch (error) {
        console.error('Error checking month availability:', error);
      } finally {
        setIsCheckingDates(false);
      }
    };
    
    checkMonthAvailability();
  }, [selectedBarber, selectedServiceDetails]);

  // Load existing bookings when barber and date selected
  useEffect(() => {
    if (selectedBarber && selectedDate) {
      fetchExistingBookings(selectedBarber, selectedDate);
    }
  }, [selectedBarber, selectedDate]);

  // Filter time slots based on barber availability
  useEffect(() => {
    const filterTimeSlots = async () => {
      if (!selectedDate || !selectedBarber || !selectedServiceDetails) {
        setAvailableTimeSlots([]);
        return;
      }
      
      setIsLoadingTimeSlots(true);
      
      try {
        const availableSlots = [];
        
        for (const time of timeSlots) {
          // Check if the time slot is within opening hours and not booked
          const isAvailable = await isWithinOpeningHours(
            selectedBarber,
            selectedDate,
            time,
            selectedServiceDetails.duration
          );
          
          if (isAvailable && !isTimeSlotBooked(time, selectedServiceDetails, existingBookings)) {
            availableSlots.push(time);
          }
        }
        
        setAvailableTimeSlots(availableSlots);
      } catch (error) {
        console.error('Error filtering time slots:', error);
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };
    
    if (selectedDate && selectedBarber && selectedServiceDetails) {
      filterTimeSlots();
    }
  }, [selectedDate, selectedBarber, selectedServiceDetails, existingBookings]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 font-playfair">Book an Appointment</h1>
        <p className="text-muted-foreground mb-8 font-playfair">Follow the steps below to book your next appointment</p>
        
        {renderStepIndicator()}
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold font-playfair text-center mb-6">{renderStepTitle()}</h2>
            
            {step === 'barber' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {barbers.map((barber) => (
                  <Card 
                    key={barber.id}
                    className={`transition-all ${barber.active 
                      ? 'cursor-pointer hover:shadow-md' 
                      : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => barber.active && handleSelectBarber(barber.id)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
                        {barber.image_url ? (
                          <img 
                            src={barber.image_url} 
                            alt={barber.name} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Scissors className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-lg">{barber.name}</h3>
                      <p className="text-sm text-muted-foreground">{barber.specialty}</p>
                      {!barber.active && (
                        <p className="text-sm text-red-500 mt-2">Currently unavailable</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {step === 'service' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {barberServices.map((service) => (
                    <Card 
                      key={service.id}
                      className="cursor-pointer transition-all hover:shadow-md"
                      onClick={() => handleSelectService(service.id)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg">{service.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{service.description}</p>
                        <div className="flex justify-between">
                          <span className="font-medium">£{service.price.toFixed(2)}</span>
                          <span className="text-sm text-muted-foreground">{service.duration} min</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleBackToBarbers}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Barbers
                  </Button>
                </div>
              </>
            )}
            
            {step === 'datetime' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-xl font-bold mb-4 font-playfair">Select Date</h3>
                    {isCheckingDates ? (
                      <div className="flex justify-center items-center h-48">
                        <Spinner className="h-8 w-8" />
                        <span className="ml-2">Checking availability...</span>
                      </div>
                    ) : (
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={isDateDisabled}
                        className="rounded-md border"
                        modifiers={{
                          unavailable: disabledDates
                        }}
                      />
                    )}
                  </div>

                  {selectedDate && (
                    <div>
                      <h3 className="text-xl font-bold mb-4 font-playfair">Select Time</h3>
                      
                      {isLoadingTimeSlots ? (
                        <div className="flex justify-center items-center h-48">
                          <Spinner className="h-8 w-8" />
                        </div>
                      ) : availableTimeSlots.length === 0 ? (
                        <div className="text-center p-4 border rounded-md bg-muted">
                          <p className="text-muted-foreground">No available time slots for this date.</p>
                          <p className="text-sm mt-2">Please select another date or barber.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                          {availableTimeSlots.map((time) => (
                            <TimeSlot 
                              key={time} 
                              time={time} 
                              selected={selectedTime === time}
                              onClick={() => setSelectedTime(time)}
                              disabled={false}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="outline" 
                    onClick={handleBackToServices}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back to Services
                  </Button>
                  
                  <Button 
                    onClick={handleDateTimeComplete}
                    className="bg-burgundy hover:bg-burgundy-light flex items-center gap-2"
                    disabled={!selectedDate || !selectedTime}
                  >
                    Continue <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
            
            {step === 'notes' && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold mb-4 font-playfair">Additional Notes (Optional)</h3>
                  <textarea
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or information for your barber..."
                  />
                </div>
                
                <div className="pt-4">
                  <h3 className="text-xl font-bold mb-4 font-playfair">Review Your Booking</h3>
                  <div className="bg-gray-100 p-4 rounded-md border text-gray-800">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium">Barber</div>
                      <div className="text-sm">{barbers.find(b => b.id === selectedBarber)?.name}</div>
                      
                      <div className="text-sm font-medium">Service</div>
                      <div className="text-sm">{services.find(s => s.id === selectedService)?.name}</div>
                      
                      <div className="text-sm font-medium">Date</div>
                      <div className="text-sm">{selectedDate ? format(selectedDate, 'EEEE, MMMM do, yyyy') : ''}</div>
                      
                      <div className="text-sm font-medium">Time</div>
                      <div className="text-sm">{selectedTime}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('datetime')}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="bg-burgundy hover:bg-burgundy-light"
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Processing...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Book;
