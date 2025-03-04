
import React from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { BookingFormState } from '@/types/booking';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';

interface ConfirmationStepProps {
  bookingResult: any;
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
  const navigate = useNavigate();
  const { selectedBarber, selectedService, selectedDate, selectedTime, guestPhone } = formData;
  
  return (
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
  );
};

export default ConfirmationStep;
