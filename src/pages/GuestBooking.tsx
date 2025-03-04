
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useGuestBookings } from '@/hooks/useGuestBookings';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Scissors, Clock, ArrowRight, ArrowLeft, Phone, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/supabase-types';

interface TimeSlotProps {
  time: string;
  selected: string;
  onClick: () => void;
  disabled?: boolean;
}

const TimeSlot: React.FC<TimeSlotProps> = ({ time, selected, onClick, disabled = false }) => {
  return (
    <button
      className={`p-2 rounded border transition-colors ${
        selected === "true" 
          ? 'bg-burgundy text-white border-burgundy' 
          : 'bg-secondary text-foreground border-input hover:bg-secondary/80'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={onClick}
      disabled={disabled}
    >
      {time}
    </button>
  );
};

const GuestBooking = () => {
  const navigate = useNavigate();
  const { barbers, isLoading: barbersLoading } = useBarbers();
  const { services, isLoading: servicesLoading } = useServices();
  const { createGuestBooking, isLoading: bookingLoading, bookingCode } = useGuestBookings();

  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [barberServices, setBarberServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [guestName, setGuestName] = useState<string>('');
  const [guestPhone, setGuestPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [step, setStep] = useState<'barber' | 'service' | 'datetime' | 'guest-info' | 'notes' | 'confirmation'>('barber');
  const [isLoadingBarberServices, setIsLoadingBarberServices] = useState<boolean>(false);
  const [existingBookings, setExistingBookings] = useState<any[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState<Service | null>(null);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [bookingResult, setBookingResult] = useState<any>(null);

  const today = startOfToday();
  const maxDate = addDays(today, 30);

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const isLoading = barbersLoading || servicesLoading || bookingLoading || isLoadingBarberServices || isLoadingBookings;

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
      
      console.log('Existing bookings:', data);
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
    if (selectedBarber && selectedDate) {
      fetchExistingBookings(selectedBarber, selectedDate);
    }
  }, [selectedBarber, selectedDate]);

  const isTimeSlotBooked = (time: string): boolean => {
    if (!selectedServiceDetails || !existingBookings.length) return false;

    // Convert current time slot to minutes for easier calculation
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    const serviceLength = selectedServiceDetails.duration;

    // Check if any existing booking overlaps with this time slot
    return existingBookings.some(booking => {
      const [bookingHours, bookingMinutes] = booking.booking_time.split(':').map(Number);
      const bookingTimeInMinutes = bookingHours * 60 + bookingMinutes;
      const bookingServiceLength = booking.services ? booking.services.duration : 60; // Default to 60 if unknown
      
      // Check if there's an overlap
      return (
        (timeInMinutes >= bookingTimeInMinutes && 
         timeInMinutes < bookingTimeInMinutes + bookingServiceLength) ||
        (timeInMinutes + serviceLength > bookingTimeInMinutes && 
         timeInMinutes < bookingTimeInMinutes)
      );
    });
  };

  const handleSelectBarber = (barberId: string) => {
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
      setStep('guest-info');
    } else {
      toast.error('Please select both date and time');
    }
  };

  const handleBackToDateTime = () => {
    setStep('datetime');
  };

  const handleGuestInfoComplete = () => {
    if (!guestName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!guestPhone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    
    // Simple phone validation
    const phoneRegex = /^\+?[0-9]{10,15}$/;
    if (!phoneRegex.test(guestPhone.replace(/\s+/g, ''))) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    setStep('notes');
  };

  const handleBackToGuestInfo = () => {
    setStep('guest-info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBarber || !selectedService || !selectedDate || !selectedTime || !guestName || !guestPhone) {
      toast.error('Please fill in all required fields');
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

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-center mb-8">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'barber' 
            ? 'bg-burgundy text-white' 
            : step === 'service' || step === 'datetime' || step === 'guest-info' || step === 'notes' || step === 'confirmation'
              ? 'bg-burgundy text-white' 
              : 'bg-gray-200 text-gray-600'
        }`}>1</div>
        
        <div className={`h-1 w-8 ${
          step === 'service' || step === 'datetime' || step === 'guest-info' || step === 'notes' || step === 'confirmation'
            ? 'bg-burgundy' 
            : 'bg-gray-200'
        }`}></div>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'service' 
            ? 'bg-burgundy text-white' 
            : step === 'datetime' || step === 'guest-info' || step === 'notes' || step === 'confirmation'
              ? 'bg-burgundy text-white' 
              : 'bg-gray-200 text-gray-600'
        }`}>2</div>
        
        <div className={`h-1 w-8 ${
          step === 'datetime' || step === 'guest-info' || step === 'notes' || step === 'confirmation'
            ? 'bg-burgundy' 
            : 'bg-gray-200'
        }`}></div>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'datetime' 
            ? 'bg-burgundy text-white' 
            : step === 'guest-info' || step === 'notes' || step === 'confirmation'
              ? 'bg-burgundy text-white' 
              : 'bg-gray-200 text-gray-600'
        }`}>3</div>
        
        <div className={`h-1 w-8 ${
          step === 'guest-info' || step === 'notes' || step === 'confirmation'
            ? 'bg-burgundy' 
            : 'bg-gray-200'
        }`}></div>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'guest-info' 
            ? 'bg-burgundy text-white' 
            : step === 'notes' || step === 'confirmation'
              ? 'bg-burgundy text-white' 
              : 'bg-gray-200 text-gray-600'
        }`}>4</div>
        
        <div className={`h-1 w-8 ${
          step === 'notes' || step === 'confirmation'
            ? 'bg-burgundy' 
            : 'bg-gray-200'
        }`}></div>
        
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          step === 'notes' 
            ? 'bg-burgundy text-white' 
            : step === 'confirmation'
              ? 'bg-burgundy text-white' 
              : 'bg-gray-200 text-gray-600'
        }`}>5</div>
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
      case 'guest-info':
        return 'Your Information';
      case 'notes':
        return 'Additional Information';
      case 'confirmation':
        return 'Booking Confirmation';
      default:
        return '';
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 font-playfair">Book as Guest</h1>
        <p className="text-muted-foreground mb-8 font-playfair">No account needed - just provide your name and phone number</p>
        
        {renderStepIndicator()}
        
        {isLoading && !showSuccess ? (
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
                    className="cursor-pointer transition-all hover:shadow-md"
                    onClick={() => handleSelectBarber(barber.id)}
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {step === 'service' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => isBefore(date, today) || isBefore(maxDate, date)}
                      className="rounded-md border"
                    />
                  </div>

                  {selectedDate && (
                    <div>
                      <h3 className="text-xl font-bold mb-4 font-playfair">Select Time</h3>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {timeSlots.map((time) => (
                          <TimeSlot 
                            key={time} 
                            time={time} 
                            selected={selectedTime === time ? "true" : "false"} 
                            onClick={() => setSelectedTime(time)}
                            disabled={isTimeSlotBooked(time)}
                          />
                        ))}
                      </div>
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
            
            {step === 'guest-info' && (
              <>
                <div className="max-w-md mx-auto">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="guestName">Your Name</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id="guestName"
                          type="text"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          placeholder="Enter your full name"
                          className="pl-10"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="guestPhone">Phone Number</Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                          <Phone className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          id="guestPhone"
                          type="tel"
                          value={guestPhone}
                          onChange={(e) => setGuestPhone(e.target.value)}
                          placeholder="Enter your phone number"
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        We'll send your booking confirmation and code via SMS
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-8">
                  <Button 
                    variant="outline" 
                    onClick={handleBackToDateTime}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" /> Back
                  </Button>
                  
                  <Button 
                    onClick={handleGuestInfoComplete}
                    className="bg-burgundy hover:bg-burgundy-light flex items-center gap-2"
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
                      
                      <div className="text-sm font-medium">Name</div>
                      <div className="text-sm">{guestName}</div>
                      
                      <div className="text-sm font-medium">Phone</div>
                      <div className="text-sm">{guestPhone}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between mt-4">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={handleBackToGuestInfo}
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
            
            {step === 'confirmation' && bookingResult && (
              <div className="text-center space-y-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-800">Booking Confirmed!</h3>
                
                <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 border border-gray-200">
                  <p className="text-gray-600 mb-4">
                    We've sent a confirmation SMS to <span className="font-semibold">{guestPhone}</span> with your booking details.
                  </p>
                  
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold mb-2">Your Booking Code</h4>
                    <div className="bg-white p-3 rounded border border-gray-300 text-center">
                      <span className="text-xl font-mono font-bold tracking-wider">{bookingResult.bookingCode}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Keep this code safe. You'll need it to manage your booking.
                    </p>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <div className="grid grid-cols-3 gap-2 mb-1">
                      <div className="font-medium">Barber:</div>
                      <div className="col-span-2">{barbers.find(b => b.id === selectedBarber)?.name}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-1">
                      <div className="font-medium">Service:</div>
                      <div className="col-span-2">{services.find(s => s.id === selectedService)?.name}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-1">
                      <div className="font-medium">Date:</div>
                      <div className="col-span-2">{selectedDate ? format(selectedDate, 'EEEE, MMMM do, yyyy') : ''}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="font-medium">Time:</div>
                      <div className="col-span-2">{selectedTime}</div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  <Button 
                    onClick={() => navigate('/')} 
                    className="bg-burgundy hover:bg-burgundy-light"
                  >
                    Return to Home
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default GuestBooking;
