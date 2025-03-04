
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Phone, User, ArrowLeft, ArrowRight, Info } from 'lucide-react';
import { BookingStepProps } from '@/types/booking';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [localPhone, setLocalPhone] = useState('');
  
  useEffect(() => {
    // Initialize local phone value from prop
    if (guestPhone) {
      // Strip any + prefix for the input display
      setLocalPhone(guestPhone.startsWith('+') ? guestPhone.substring(1) : guestPhone);
    }
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only digits for the input
    const cleanedInput = e.target.value.replace(/[^\d]/g, '');
    setLocalPhone(cleanedInput);
    
    // Format for E.164 and update parent state
    let formattedPhone = cleanedInput;
    
    // If it starts with a 0, it's likely a UK number, replace with +44
    if (cleanedInput.startsWith('0')) {
      formattedPhone = '+44' + cleanedInput.substring(1);
    } else {
      // For all other cases, add +44 if no country code is detected
      if (cleanedInput && !cleanedInput.startsWith('44')) {
        formattedPhone = '+44' + cleanedInput;
      } else {
        formattedPhone = '+' + cleanedInput;
      }
    }
    
    setGuestPhone(formattedPhone);
  };
  
  const handleNextClick = () => {
    // Final validation before proceeding
    if (!guestName.trim()) {
      alert('Please enter your name');
      return;
    }
    
    if (!guestPhone || guestPhone.length < 10) {
      alert('Please enter a valid phone number');
      return;
    }
    
    onNext();
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
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Enter your full name"
                className="pl-10"
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="guestPhone">Phone Number</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-muted-foreground cursor-help">
                      <Info className="h-3 w-3 mr-1" />
                      Format Help
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Enter your phone number in UK format.</p>
                    <p className="mt-1">Examples:</p>
                    <ul className="list-disc pl-4 mt-1">
                      <li>If UK mobile: 07XXX XXXXXX</li>
                      <li>If including country code: 44XXXXXXXXXX</li>
                    </ul>
                    <p className="mt-1">Your number will be formatted as +44...</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <div className="flex">
                <div className="bg-muted flex items-center px-3 border border-r-0 border-input rounded-l-md text-sm text-muted-foreground">
                  +44
                </div>
                <Input
                  id="guestPhone"
                  type="tel"
                  value={localPhone.startsWith('44') ? localPhone.substring(2) : localPhone}
                  onChange={handlePhoneChange}
                  placeholder="7XXX XXXXXX"
                  className="rounded-l-none"
                  required
                />
              </div>
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
          onClick={handleNextClick}
          className="bg-burgundy hover:bg-burgundy-light flex items-center gap-2"
        >
          Continue <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};

export default GuestInfoStep;
