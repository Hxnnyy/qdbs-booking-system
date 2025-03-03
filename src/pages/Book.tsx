
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useBarbers } from '@/hooks/useBarbers';
import { useServices } from '@/hooks/useServices';
import { useBookings } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Calendar as CalendarIcon, Check } from 'lucide-react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import TimeSlot from '@/components/TimeSlot';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';

const Book = () => {
  const { user } = useAuth();
  const { barbers, isLoading: isLoadingBarbers } = useBarbers();
  const { services, isLoading: isLoadingServices } = useServices();
  const { createBooking, isLoading: isLoadingBooking } = useBookings();

  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState<Date | null>(null);
  const [bookingTime, setBookingTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarber || !selectedService || !bookingDate || !bookingTime) {
      return;
    }

    const bookingData = {
      barber_id: selectedBarber,
      service_id: selectedService,
      booking_date: format(bookingDate, 'yyyy-MM-dd'),
      booking_time: bookingTime,
      notes,
      status: 'confirmed'
    };

    try {
      await createBooking(bookingData);
      // Reset form after successful booking
      setSelectedBarber(null);
      setSelectedService(null);
      setBookingDate(null);
      setBookingTime('');
      setNotes('');
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-4">Book an Appointment</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Select Barber</h2>
            {isLoadingBarbers ? (
              <Spinner />
            ) : (
              <Select
                value={selectedBarber || ''}
                onValueChange={setSelectedBarber}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a barber" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id}>
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold">Select Service</h2>
            {isLoadingServices ? (
              <Spinner />
            ) : (
              <Select
                value={selectedService || ''}
                onValueChange={setSelectedService}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold">Select Date</h2>
            <Calendar
              selected={bookingDate}
              onSelect={setBookingDate}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Select Time</h2>
            <TimeSlot
              selected={bookingTime}
              onChange={setBookingTime}
            />
          </div>

          <div>
            <h2 className="text-lg font-semibold">Notes</h2>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>

          <Button
            type="submit"
            className="bg-burgundy hover:bg-burgundy-light"
            disabled={isLoadingBooking}
          >
            {isLoadingBooking ? (
              <>
                <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Booking...
              </>
            ) : (
              'Book Appointment'
            )}
          </Button>
        </form>
      </div>
    </Layout>
  );
};

export default Book;
