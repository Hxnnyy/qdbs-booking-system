
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { BookingStepProps, BookingFormState, BookingResult } from '@/types/booking';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';
import { format } from 'date-fns';
import { Calendar, CheckCircle } from 'lucide-react';
import { useTimeSlots } from '@/hooks/useTimeSlots';

interface ConfirmationStepProps extends BookingStepProps {
  bookingResult: BookingResult;
  formData: BookingFormState;
  barbers: Barber[];
  services: Service[];
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ 
  bookingResult, 
  formData,
  barbers,
  services
}) => {
  // Use the timeslots hook to get the selected barber for "any barber" option
  const { selectedBarberForBooking } = useTimeSlots(
    formData.selectedDate,
    formData.selectedBarber,
    formData.selectedServiceDetails,
    [], // Empty array as we don't need to calculate slots here
    []
  );

  const selectedBarber = formData.selectedBarber === 'any' && selectedBarberForBooking
    ? barbers.find(b => b.id === selectedBarberForBooking)
    : barbers.find(b => b.id === formData.selectedBarber);
    
  const selectedService = services.find(s => s.id === formData.selectedService);

  return (
    <div className="flex flex-col items-center text-center space-y-8">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600" />
      </div>
      
      <div>
        <h3 className="text-2xl font-bold mb-2 font-playfair">Booking Confirmed!</h3>
        <p className="text-muted-foreground">
          Thank you for booking with us. We've sent a confirmation to your email and phone.
        </p>
      </div>
      
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Booking Reference</p>
            <p className="font-bold text-lg">{bookingResult.bookingCode}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Barber</p>
              <p className="font-medium">
                {selectedBarber ? selectedBarber.name : formData.selectedBarber === 'any' ? 'Available Barber' : 'Selected Barber'}
              </p>
            </div>
            
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Service</p>
              <p className="font-medium">{selectedService?.name}</p>
            </div>
          </div>
          
          <div className="flex items-center border-t border-b py-4 my-2">
            <Calendar className="mr-2 h-5 w-5 text-burgundy" />
            <div>
              <p className="font-medium">
                {formData.selectedDate ? format(formData.selectedDate, 'EEEE, MMMM d, yyyy') : ''}
              </p>
              <p className="text-sm text-muted-foreground">at {formData.selectedTime}</p>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Customer</p>
            <p className="font-medium">{formData.guestName}</p>
            <p className="text-sm">{formData.guestPhone}</p>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button asChild variant="outline" className="flex-1">
          <Link to="/verify-guest-booking">
            Manage Booking
          </Link>
        </Button>
        
        <Button asChild className="flex-1 bg-burgundy hover:bg-burgundy-light">
          <Link to="/">
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationStep;
