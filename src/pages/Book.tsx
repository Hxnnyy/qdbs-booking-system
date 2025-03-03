import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Calendar } from '@/components/ui/calendar';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useBookings } from '@/hooks/useBookings';
import { toast } from 'sonner';
import TimeSlots from '@/components/TimeSlots';

const Book = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { barbers, isLoading: barbersLoading } = useBarbers();
  const { services, isLoading: servicesLoading } = useServices();
  const { createBooking, isLoading: bookingLoading } = useBookings();
  
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [step, setStep] = useState(1);
  
  const isLoading = barbersLoading || servicesLoading;
  
  useEffect(() => {
    if (!user) {
      toast.error('Please log in to book an appointment');
      navigate('/login');
    }
  }, [user, navigate]);
  
  // Reset time slot when date changes
  useEffect(() => {
    setSelectedTimeSlot(null);
  }, [selectedDate]);
  
  const handleNext = () => {
    if (step === 1 && (!selectedBarber || !selectedService)) {
      toast.error('Please select a barber and service');
      return;
    }
    
    if (step === 2 && (!selectedDate || !selectedTimeSlot)) {
      toast.error('Please select a date and time');
      return;
    }
    
    setStep(step + 1);
  };
  
  const handleBack = () => {
    setStep(step - 1);
  };
  
  const handleSubmit = async () => {
    if (!selectedBarber || !selectedService || !selectedDate || !selectedTimeSlot) {
      toast.error('Please complete all required fields');
      return;
    }
    
    try {
      await createBooking({
        barber_id: selectedBarber,
        service_id: selectedService,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: selectedTimeSlot,
        notes: notes.trim() || undefined
      });
      
      navigate('/profile');
    } catch (error) {
      // Error is handled in the useBookings hook
    }
  };
  
  const selectedBarberName = selectedBarber 
    ? barbers.find(b => b.id === selectedBarber)?.name 
    : '';
  
  const selectedServiceName = selectedService 
    ? services.find(s => s.id === selectedService)?.name 
    : '';
  
  const selectedServiceDuration = selectedService 
    ? services.find(s => s.id === selectedService)?.duration 
    : 0;
  
  const selectedServicePrice = selectedService 
    ? services.find(s => s.id === selectedService)?.price 
    : 0;
  
  const disabledDays = {
    before: startOfDay(new Date()),
    after: addDays(new Date(), 30)
  };
  
  return (
    <Layout>
      <div className="container mx-auto py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-8 font-playfair">Book an Appointment</h1>
        
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 1 ? 'bg-burgundy text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 2 ? 'bg-burgundy text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= 3 ? 'bg-burgundy text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {step === 1 && 'Select barber & service'}
              {step === 2 && 'Choose date & time'}
              {step === 3 && 'Review & confirm'}
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-12 h-12" />
          </div>
        ) : (
          <>
            {step === 1 && (
              <div className="space-y-6">
                <Card className="glass shadow-subtle border border-border">
                  <CardHeader>
                    <CardTitle>Select a Barber</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {barbers.map((barber) => (
                        <div 
                          key={barber.id}
                          className={`p-4 rounded-lg cursor-pointer transition-all ${
                            selectedBarber === barber.id 
                              ? 'bg-burgundy/10 border-2 border-burgundy' 
                              : 'bg-secondary/30 border-2 border-transparent hover:border-burgundy/50'
                          }`}
                          onClick={() => setSelectedBarber(barber.id)}
                        >
                          <h3 className="font-semibold text-lg">{barber.name}</h3>
                          <p className="text-sm text-muted-foreground">{barber.specialty}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="glass shadow-subtle border border-border">
                  <CardHeader>
                    <CardTitle>Select a Service</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {services.map((service) => (
                        <div 
                          key={service.id}
                          className={`p-4 rounded-lg cursor-pointer transition-all ${
                            selectedService === service.id 
                              ? 'bg-burgundy/10 border-2 border-burgundy' 
                              : 'bg-secondary/30 border-2 border-transparent hover:border-burgundy/50'
                          }`}
                          onClick={() => setSelectedService(service.id)}
                        >
                          <div className="flex justify-between">
                            <h3 className="font-semibold text-lg">{service.name}</h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">{service.duration} min</span>
                              <span className="font-semibold">£{service.price.toFixed(2)}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{service.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleNext}
                    className="bg-burgundy hover:bg-burgundy-light"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            
            {step === 2 && (
              <div className="space-y-6">
                <Card className="glass shadow-subtle border border-border">
                  <CardHeader>
                    <CardTitle>Select a Date</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-center">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={disabledDays}
                        className="rounded-md border"
                      />
                    </div>
                  </CardContent>
                </Card>
                
                {selectedDate && (
                  <Card className="glass shadow-subtle border border-border">
                    <CardHeader>
                      <CardTitle>Select a Time</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TimeSlots 
                        date={selectedDate} 
                        barberId={selectedBarber!}
                        duration={selectedServiceDuration!}
                        selectedSlot={selectedTimeSlot}
                        onSelect={(slotId) => setSelectedTimeSlot(slotId as string)}
                      />
                    </CardContent>
                  </Card>
                )}
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleNext}
                    className="bg-burgundy hover:bg-burgundy-light"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
            
            {step === 3 && (
              <div className="space-y-6">
                <Card className="glass shadow-subtle border border-border">
                  <CardHeader>
                    <CardTitle>Review Your Booking</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h3 className="font-medium text-muted-foreground">Barber</h3>
                          <p className="font-semibold">{selectedBarberName}</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-muted-foreground">Service</h3>
                          <p className="font-semibold">{selectedServiceName}</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-muted-foreground">Date</h3>
                          <p className="font-semibold">{selectedDate ? format(selectedDate, 'PPP') : ''}</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-muted-foreground">Time</h3>
                          <p className="font-semibold">{selectedTimeSlot}</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-muted-foreground">Duration</h3>
                          <p className="font-semibold">{selectedServiceDuration} minutes</p>
                        </div>
                        <div>
                          <h3 className="font-medium text-muted-foreground">Price</h3>
                          <p className="font-semibold">£{selectedServicePrice?.toFixed(2)}</p>
                        </div>
                      </div>
                      
                      <div className="pt-4">
                        <Label htmlFor="notes">Additional Notes (optional)</Label>
                        <Textarea
                          id="notes"
                          placeholder="Any special requests or information for your barber"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="mt-2"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={bookingLoading}
                    className="bg-burgundy hover:bg-burgundy-light"
                  >
                    {bookingLoading ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Booking...
                      </>
                    ) : (
                      'Confirm Booking'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default Book;
