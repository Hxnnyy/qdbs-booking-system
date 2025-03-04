
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
import { format, addDays, isBefore, startOfToday } from 'date-fns';
import { toast } from 'sonner';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Scissors, Clock } from 'lucide-react';

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

const Book = () => {
  const navigate = useNavigate();
  const { barbers, isLoading: barbersLoading } = useBarbers();
  const { services, isLoading: servicesLoading } = useServices();
  const { createBooking, isLoading: bookingLoading } = useBookings();
  const { user } = useAuth();

  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>('');

  const today = startOfToday();
  const maxDate = addDays(today, 30);

  // Available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const isLoading = barbersLoading || servicesLoading || bookingLoading;

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
      await createBooking({
        barber_id: selectedBarber,
        service_id: selectedService,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        booking_time: selectedTime,
        notes: notes.trim() || null
      });

      navigate('/profile');
    } catch (error) {
      console.error('Booking error:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4 font-playfair">Book an Appointment</h1>
        <p className="text-muted-foreground mb-8 font-playfair">Select your preferences to book your next appointment</p>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <Tabs defaultValue="barber" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="barber" className="flex items-center gap-2">
                  <Scissors className="h-4 w-4" /> Choose Barber
                </TabsTrigger>
                <TabsTrigger value="service" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Select Service
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="barber" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {barbers.map((barber) => (
                    <Card 
                      key={barber.id}
                      className={`cursor-pointer transition-all ${
                        selectedBarber === barber.id ? 'ring-2 ring-burgundy' : ''
                      }`}
                      onClick={() => setSelectedBarber(barber.id)}
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
              </TabsContent>
              
              <TabsContent value="service" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <Card 
                      key={service.id}
                      className={`cursor-pointer transition-all ${
                        selectedService === service.id ? 'ring-2 ring-burgundy' : ''
                      }`}
                      onClick={() => setSelectedService(service.id)}
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
              </TabsContent>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-bold mb-4 font-playfair">Select Date</h2>
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
                  <h2 className="text-xl font-bold mb-4 font-playfair">Select Time</h2>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map((time) => (
                      <TimeSlot 
                        key={time} 
                        time={time} 
                        selected={selectedTime === time ? "true" : "false"} 
                        onClick={() => setSelectedTime(time)} 
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-bold mb-4 font-playfair">Additional Notes (Optional)</h2>
              <textarea
                className="w-full p-2 border rounded-md"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests or information for your barber..."
              />
            </div>

            <Button 
              type="submit" 
              className="bg-burgundy hover:bg-burgundy-light w-full md:w-auto"
              disabled={!selectedBarber || !selectedService || !selectedDate || !selectedTime || bookingLoading}
            >
              {bookingLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Processing...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </form>
        )}
      </div>
    </Layout>
  );
};

export default Book;
