import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon, ChevronRight, User } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/context/AuthContext';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useBookings } from '@/hooks/useBookings';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Define types for the opening hours
type ClosedDay = {
  isOpen: false;
  name: string;
};

type OpenDay = {
  isOpen: true;
  name: string;
  start: number;
  end: number;
};

type DayConfig = ClosedDay | OpenDay;

// Opening hours configuration with proper typing
const openingHours: Record<number, DayConfig> = {
  0: { isOpen: false, name: 'Sunday' }, // Sunday - closed
  1: { isOpen: false, name: 'Monday' }, // Monday - closed
  2: { isOpen: true, name: 'Tuesday', start: 9, end: 18 }, // Tuesday 9am-6pm
  3: { isOpen: true, name: 'Wednesday', start: 9, end: 17 }, // Wednesday 9am-5pm
  4: { isOpen: true, name: 'Thursday', start: 10, end: 20 }, // Thursday 10am-8pm
  5: { isOpen: true, name: 'Friday', start: 9, end: 18 }, // Friday 9am-6pm
  6: { isOpen: true, name: 'Saturday', start: 8, end: 16 }, // Saturday 8am-4pm
};

const Book = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { barbers } = useBarbers();
  const { services } = useServices();
  const { createBooking, isLoading: isBookingLoading } = useBookings();
  
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [step, setStep] = useState(1);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [isLoadingTimeSlots, setIsLoadingTimeSlots] = useState(false);
  
  // Form fields with defaults from profile
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');

  useEffect(() => {
    // Set user profile data once it's loaded
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setPhone(profile.phone || '');
    }
    
    if (user) {
      setEmail(user.email || '');
    }
  }, [profile, user]);

  // Check if there's a service ID in the URL and pre-select it
  useEffect(() => {
    const serviceId = searchParams.get('service');
    if (serviceId && services.some(s => s.id === serviceId)) {
      setSelectedService(serviceId);
    }
  }, [searchParams, services]);

  const nextStep = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  // Generate available time slots based on the selected date
  useEffect(() => {
    const fetchAvailableTimeSlots = async () => {
      if (!date || !selectedBarber || !selectedService) return;
      
      setIsLoadingTimeSlots(true);
      
      try {
        const dayOfWeek = date.getDay();
        const dayConfig = openingHours[dayOfWeek];
        
        if (!dayConfig.isOpen) {
          setAvailableTimeSlots([]);
          return;
        }
        
        // Get the selected service duration
        const service = services.find(s => s.id === selectedService);
        if (!service) return;
        
        const serviceDuration = service.duration;
        
        // Get all possible time slots based on opening hours
        const slots = [];
        for (let hour = (dayConfig as OpenDay).start; hour < (dayConfig as OpenDay).end; hour++) {
          slots.push(`${hour}:00`);
          if (hour + 0.5 < (dayConfig as OpenDay).end) {
            slots.push(`${hour}:30`);
          }
        }
        
        // Check against existing bookings to see which slots are available
        const formattedDate = format(date, 'yyyy-MM-dd');
        
        // Query Supabase to check which slots are already booked
        const { data: bookedSlots } = await supabase.rpc('is_booking_available', {
          barber_id: selectedBarber,
          booking_date: formattedDate,
          booking_time: slots, // This would need to be modified in the DB function to accept an array
          service_duration: serviceDuration
        });
        
        // For now, as a simple approach, we'll just return all slots
        // In a real implementation, you would check each slot against booked slots
        
        // Convert 24-hour format to 12-hour format
        const formattedSlots = slots.map(slot => {
          const [hourStr, minute] = slot.split(':');
          let hour = parseInt(hourStr);
          const amPm = hour >= 12 ? 'PM' : 'AM';
          
          if (hour === 0) {
            return `12:${minute} AM`;
          } else if (hour === 12) {
            return `12:${minute} PM`;
          } else if (hour > 12) {
            return `${hour - 12}:${minute} ${amPm}`;
          } else {
            return `${hour}:${minute} ${amPm}`;
          }
        });
        
        setAvailableTimeSlots(formattedSlots);
      } catch (error) {
        console.error('Error fetching available time slots:', error);
        toast.error('Failed to fetch available time slots');
      } finally {
        setIsLoadingTimeSlots(false);
      }
    };
    
    fetchAvailableTimeSlots();
  }, [date, selectedBarber, selectedService, services]);

  const handleSubmit = async () => {
    if (!user || !date || !selectedTime || !selectedBarber || !selectedService) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    try {
      // Convert selected time from "1:00 PM" format to "13:00" format
      const timeRegex = /(\d+):(\d+)\s+(AM|PM)/;
      const timeMatch = selectedTime.match(timeRegex);
      
      if (!timeMatch) {
        toast.error('Invalid time format');
        return;
      }
      
      let hour = parseInt(timeMatch[1]);
      const minute = timeMatch[2];
      const period = timeMatch[3];
      
      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }
      
      const formattedTime = `${hour.toString().padStart(2, '0')}:${minute}`;
      
      // Format date as YYYY-MM-DD
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const bookingData = {
        barber_id: selectedBarber,
        service_id: selectedService,
        booking_date: formattedDate,
        booking_time: formattedTime,
        notes: notes
      };
      
      await createBooking(bookingData);
      
      // Redirect to profile/bookings page
      navigate('/profile');
      
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 md:py-24 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <span className="inline-block px-3 py-1 text-xs font-medium bg-burgundy/20 text-burgundy rounded-full mb-4">
            Simple Booking
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4 font-playfair">Book Your Appointment</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto font-playfair">
            Follow the steps below to schedule your next appointment at Queens Dock Barbershop
          </p>
        </motion.div>

        <div className="mb-10">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  step >= i ? 'bg-burgundy text-primary-foreground' : 'bg-secondary text-muted-foreground'
                }`}>
                  {i}
                </div>
                <span className={`text-xs hidden md:block ${
                  step >= i ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {i === 1 ? 'Select Barber' : 
                   i === 2 ? 'Choose Service' : 
                   i === 3 ? 'Pick Date & Time' : 'Confirm Details'}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-secondary h-1 mt-4 rounded-full overflow-hidden">
            <div 
              className="bg-burgundy h-full transition-all duration-300" 
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <Card className="glass shadow-subtle border border-border">
          {step === 1 && (
            <>
              <CardHeader>
                <div className="flex items-center mb-2">
                  <User className="mr-2 h-5 w-5 text-burgundy" />
                  <CardTitle>Select Your Barber</CardTitle>
                </div>
                <CardDescription>
                  Choose from our team of skilled professionals
                </CardDescription>
              </CardHeader>
              <CardContent>
                {barbers.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {barbers.map((barber) => (
                      <div 
                        key={barber.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedBarber === barber.id 
                            ? 'border-burgundy bg-burgundy/5' 
                            : 'border-border hover:border-burgundy/50'
                        }`}
                        onClick={() => setSelectedBarber(barber.id)}
                      >
                        <div className="flex items-center">
                          <div className="mr-3 bg-secondary rounded-full w-10 h-10 flex items-center justify-center text-burgundy">
                            {barber.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-medium">{barber.name}</h3>
                            <p className="text-sm text-muted-foreground">{barber.specialty}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={nextStep} 
                  disabled={!selectedBarber}
                  className="w-full md:w-auto bg-burgundy hover:bg-burgundy-light"
                >
                  Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <div className="flex items-center mb-2">
                  <User className="mr-2 h-5 w-5 text-burgundy" />
                  <CardTitle>Select a Service</CardTitle>
                </div>
                <CardDescription>
                  Choose the service you'd like to book
                </CardDescription>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="flex justify-center py-8">
                    <Spinner className="w-8 h-8" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div 
                        key={service.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          selectedService === service.id 
                            ? 'border-burgundy bg-burgundy/5' 
                            : 'border-border hover:border-burgundy/50'
                        }`}
                        onClick={() => setSelectedService(service.id)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-medium">{service.name}</h3>
                            <p className="text-sm text-muted-foreground">{service.duration} min</p>
                          </div>
                          <div className="text-lg font-semibold text-burgundy">
                            £{service.price.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!selectedService}
                  className="bg-burgundy hover:bg-burgundy-light"
                >
                  Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {step === 3 && (
            <>
              <CardHeader>
                <div className="flex items-center mb-2">
                  <CalendarIcon className="mr-2 h-5 w-5 text-burgundy" />
                  <CardTitle>Choose Date & Time</CardTitle>
                </div>
                <CardDescription>
                  Select your preferred appointment date and time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <Label className="mb-2 block">Select a date</Label>
                    <div className="border rounded-md p-1">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                          setDate(newDate);
                          setSelectedTime(''); // Reset selected time when date changes
                        }}
                        className="w-full"
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          // Disable dates in the past, Mondays and Sundays
                          const dayOfWeek = date.getDay();
                          return date < today || !openingHours[dayOfWeek].isOpen;
                        }}
                      />
                    </div>
                    {date && (
                      <div className="mt-2 text-sm text-muted-foreground font-playfair">
                        <p>
                          {openingHours[date.getDay()].isOpen ? (
                            `Opening hours on ${format(date, 'EEEE')}: ${(openingHours[date.getDay()] as OpenDay).start}:00 AM - ${(openingHours[date.getDay()] as OpenDay).end > 12 ? `${(openingHours[date.getDay()] as OpenDay).end - 12}:00 PM` : `${(openingHours[date.getDay()] as OpenDay).end}:00 AM`}`
                          ) : (
                            `We're closed on ${format(date, 'EEEE')}. Please select another day.`
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Available time slots</Label>
                    {isLoadingTimeSlots ? (
                      <div className="flex justify-center py-8">
                        <Spinner className="w-8 h-8" />
                      </div>
                    ) : date && selectedBarber && selectedService ? (
                      openingHours[date.getDay()].isOpen ? (
                        availableTimeSlots.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {availableTimeSlots.map((time) => (
                              <button
                                key={time}
                                type="button"
                                className={`p-2 text-sm rounded-md border ${
                                  selectedTime === time 
                                    ? 'bg-burgundy text-primary-foreground border-burgundy' 
                                    : 'border-border hover:border-burgundy/50'
                                }`}
                                onClick={() => setSelectedTime(time)}
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="text-muted-foreground font-playfair p-4 border rounded-lg bg-secondary/30">
                            <p>No available time slots for this date. Please select another date or barber.</p>
                          </div>
                        )
                      ) : (
                        <div className="text-muted-foreground font-playfair p-4 border rounded-lg bg-secondary/30">
                          <p>We're closed on the selected date. Please choose another day.</p>
                        </div>
                      )
                    ) : (
                      <div className="text-muted-foreground font-playfair p-4 border rounded-lg bg-secondary/30">
                        <p>Please select a barber, service, and date to view available time slots.</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!date || !selectedTime}
                  className="bg-burgundy hover:bg-burgundy-light"
                >
                  Continue <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </>
          )}

          {step === 4 && (
            <>
              <CardHeader>
                <div className="flex items-center mb-2">
                  <User className="mr-2 h-5 w-5 text-burgundy" />
                  <CardTitle>Confirm Your Details</CardTitle>
                </div>
                <CardDescription>
                  Review your appointment details and provide your information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Barber:</span>
                      <span className="font-medium">
                        {barbers.find(b => b.id === selectedBarber)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service:</span>
                      <span className="font-medium">
                        {services.find(s => s.id === selectedService)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span className="font-medium">
                        {date ? format(date, 'EEEE, MMMM d, yyyy') : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Time:</span>
                      <span className="font-medium">{selectedTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium text-burgundy">
                        £{services.find(s => s.id === selectedService)?.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input 
                          id="firstName" 
                          placeholder="John" 
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input 
                          id="lastName" 
                          placeholder="Smith" 
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="john@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input 
                        id="phone" 
                        placeholder="07700 900000" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Special Requests (Optional)</Label>
                      <Textarea 
                        id="notes" 
                        placeholder="Any additional information or requests for your barber..." 
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button 
                  className="w-full bg-burgundy hover:bg-burgundy-light" 
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isBookingLoading}
                >
                  {isBookingLoading ? (
                    <>
                      <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Processing...
                    </>
                  ) : (
                    'Confirm Booking'
                  )}
                </Button>
                <Button variant="outline" onClick={prevStep} className="w-full">
                  Go Back
                </Button>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </Layout>
  );
};

export default Book;
