
import React from 'react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { BookingFormState, TwilioSMSResult, BookingResult } from '@/types/booking';
import { Barber } from '@/hooks/useBarbers';
import { Service } from '@/supabase-types';
import { Clipboard, CalendarDays, Check, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface ConfirmationStepProps {
  bookingResult: BookingResult;
  formData: BookingFormState;
  barbers: Barber[];
  services: Service[];
  onNext?: () => void; // Added onNext as an optional prop
}

const ConfirmationStep: React.FC<ConfirmationStepProps> = ({ 
  bookingResult, 
  formData, 
  barbers, 
  services 
}) => {
  const navigate = useNavigate();
  const { selectedBarber, selectedService, selectedDate, selectedTime, guestEmail } = formData;
  const twilioResult = bookingResult?.twilioResult as TwilioSMSResult;
  
  console.log("Confirmation step received booking result:", bookingResult);
  
  const handleCopyCode = () => {
    if (bookingResult?.bookingCode) {
      navigator.clipboard.writeText(bookingResult.bookingCode);
      toast.success('Booking code copied to clipboard!');
    }
  };
  
  const handleManageBooking = () => {
    navigate('/verify-booking');
  };
  
  if (!bookingResult || !bookingResult.bookingCode) {
    return (
      <div className="text-center space-y-6">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        
        <h3 className="text-2xl font-bold text-burgundy">Booking Confirmed, but Booking Code Missing</h3>
        <p className="text-gray-600 max-w-md mx-auto">
          Your booking has been confirmed, but there was an issue generating your booking code. 
          Please contact support for assistance.
        </p>
        
        <Button 
          onClick={() => navigate('/')} 
          variant="outline"
          className="text-burgundy border-burgundy hover:bg-burgundy/10"
        >
          Return to Home
        </Button>
      </div>
    );
  }
  
  return (
    <div className="text-center space-y-6">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <h3 className="text-2xl font-bold text-burgundy">Booking Confirmed!</h3>
      
      <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-6 border border-gray-200">
        <div className="flex flex-col items-center justify-center space-y-2 mb-4">
          <div className="flex items-center justify-center text-green-600">
            <Mail className="h-5 w-5 mr-2" />
            <p className="text-sm">
              We've sent a confirmation email to {guestEmail} with all your booking details.
            </p>
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-lg font-semibold mb-2">Your Booking Code</h4>
          <div className="bg-burgundy p-3 rounded border border-burgundy-dark text-center relative">
            <span className="text-xl font-mono font-bold tracking-wider text-white">{bookingResult.bookingCode}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-white hover:bg-burgundy-light"
              onClick={handleCopyCode}
            >
              <Clipboard className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Keep this code safe. You'll need it to manage or cancel your booking.
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
        
        <div className="mt-4 text-xs text-gray-500 border-t border-gray-200 pt-3">
          <div className="flex items-center justify-center">
            <Check className="h-3 w-3 mr-1 text-green-600" />
            <span>You'll receive a reminder 24 hours before your appointment</span>
          </div>
        </div>
      </div>
      
      <div className="mt-6 flex flex-col items-center space-y-4">
        <Button 
          onClick={handleManageBooking} 
          className="bg-burgundy hover:bg-burgundy-dark text-white flex items-center gap-2"
        >
          <CalendarDays className="h-4 w-4" />
          Manage My Booking
        </Button>
        <Button 
          onClick={() => navigate('/')} 
          variant="outline"
          className="text-burgundy border-burgundy hover:bg-burgundy/10"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default ConfirmationStep;
