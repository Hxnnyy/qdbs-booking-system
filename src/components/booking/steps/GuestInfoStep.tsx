
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, User, ArrowLeft, ArrowRight } from 'lucide-react';
import { BookingStepProps } from '@/types/booking';

interface GuestInfoStepProps extends BookingStepProps {
  guestName: string;
  setGuestName: (name: string) => void;
  guestPhone: string;
  setGuestPhone: (phone: string) => void;
}

const GuestInfoStep: React.FC<GuestInfoStepProps> = ({ 
  guestName, 
  setGuestName, 
  guestPhone, 
  setGuestPhone,
  onNext,
  onBack
}) => {
  // Create handler functions to update state without triggering navigation
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuestName(e.target.value);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGuestPhone(e.target.value);
  };

  return (
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
                onChange={handleNameChange}
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
                onChange={handlePhoneChange}
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
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        
        <Button 
          onClick={onNext}
          className="bg-burgundy hover:bg-burgundy-light flex items-center gap-2"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};

export default GuestInfoStep;
