import React, { useState } from 'react';
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

const barbers = [
  { id: 1, name: 'Chris Skeggs', specialty: 'Classic Cuts & Styling' },
  { id: 2, name: 'Thomas Mayfield', specialty: 'Modern Styles & Fades' },
  { id: 3, name: 'Conor McKernan', specialty: 'Beard Grooming & Shaves' },
];

const services = [
  { id: 1, name: 'Haircut', price: '£25', duration: '30 min' },
  { id: 2, name: 'Beard Trim', price: '£10', duration: '20 min' },
  { id: 3, name: 'Buzz Cut', price: '£15', duration: '20 min' },
  { id: 4, name: 'Hot Towel Shave', price: '£35', duration: '45 min' },
];

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
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [step, setStep] = useState(1);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  const nextStep = () => {
    setStep(step + 1);
    window.scrollTo(0, 0);
  };

  const prevStep = () => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  // Generate available time slots based on the selected date
  const getAvailableTimeSlots = () => {
    if (!date) return [];
    
    const dayOfWeek = date.getDay();
    const dayConfig = openingHours[dayOfWeek];
    
    if (!dayConfig.isOpen) return [];
    
    // TypeScript now knows that dayConfig has start and end because we've checked isOpen
    const slots = [];
    for (let hour = dayConfig.start; hour < dayConfig.end; hour++) {
      slots.push(`${hour}:00 ${hour < 12 ? 'AM' : 'PM'}`);
      if (hour + 0.5 < dayConfig.end) {
        slots.push(`${hour}:30 ${hour < 12 ? 'AM' : 'PM'}`);
      }
    }
    
    // Convert 24-hour format to 12-hour format
    return slots.map(slot => {
      const [hourStr, minuteAmPm] = slot.split(':');
      const [minute, amPm] = minuteAmPm.split(' ');
      let hour = parseInt(hourStr);
      
      if (hour === 0) {
        return `12:${minute} AM`;
      } else if (hour === 12) {
        return `12:${minute} PM`;
      } else if (hour > 12) {
        return `${hour - 12}:${minute} PM`;
      } else {
        return `${hour}:${minute} ${amPm}`;
      }
    });
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
          <span className="inline-block px-3 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full mb-4">
            Simple Booking
          </span>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Book Your Appointment</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Follow the steps below to schedule your next appointment at Queens Dock Barbershop
          </p>
        </motion.div>

        <div className="mb-10">
          <div className="flex justify-between items-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                  step >= i ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
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
              className="bg-primary h-full transition-all duration-300" 
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
        </div>

        <Card className="glass shadow-subtle border border-border">
          {step === 1 && (
            <>
              <CardHeader>
                <div className="flex items-center mb-2">
                  <User className="mr-2 h-5 w-5 text-primary" />
                  <CardTitle>Select Your Barber</CardTitle>
                </div>
                <CardDescription>
                  Choose from our team of skilled professionals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {barbers.map((barber) => (
                    <div 
                      key={barber.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedBarber === barber.id.toString() 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedBarber(barber.id.toString())}
                    >
                      <div className="flex items-center">
                        <div className="mr-3 bg-secondary rounded-full w-10 h-10 flex items-center justify-center text-primary">
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
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  onClick={nextStep} 
                  disabled={!selectedBarber}
                  className="w-full md:w-auto"
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
                  <User className="mr-2 h-5 w-5 text-primary" />
                  <CardTitle>Select a Service</CardTitle>
                </div>
                <CardDescription>
                  Choose the service you'd like to book
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {services.map((service) => (
                    <div 
                      key={service.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedService === service.id.toString() 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedService(service.id.toString())}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">{service.duration}</p>
                        </div>
                        <div className="text-lg font-semibold text-primary">
                          {service.price}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  Back
                </Button>
                <Button 
                  onClick={nextStep} 
                  disabled={!selectedService}
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
                  <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
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
                    {date && openingHours[date.getDay()].isOpen ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {getAvailableTimeSlots().map((time) => (
                          <button
                            key={time}
                            type="button"
                            className={`p-2 text-sm rounded-md border ${
                              selectedTime === time 
                                ? 'bg-primary text-primary-foreground border-primary' 
                                : 'border-border hover:border-primary/50'
                            }`}
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground font-playfair">
                        {date ? (
                          <p>We're closed on the selected date. Please choose another day.</p>
                        ) : (
                          <p>Please select a date to view available time slots.</p>
                        )}
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
                  <User className="mr-2 h-5 w-5 text-primary" />
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
                        {barbers.find(b => b.id.toString() === selectedBarber)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Service:</span>
                      <span className="font-medium">
                        {services.find(s => s.id.toString() === selectedService)?.name}
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
                      <span className="font-medium text-primary">
                        {services.find(s => s.id.toString() === selectedService)?.price}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input id="firstName" placeholder="John" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input id="lastName" placeholder="Smith" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="john@example.com" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input id="phone" placeholder="07700 900000" />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="notes">Special Requests (Optional)</Label>
                      <Textarea id="notes" placeholder="Any additional information or requests for your barber..." />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button className="w-full" size="lg">
                  Confirm Booking
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
