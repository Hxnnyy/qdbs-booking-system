
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Phone, KeyRound } from 'lucide-react';

interface VerificationFormProps {
  phone: string;
  code: string;
  isLoading: boolean;
  onPhoneChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const VerificationForm: React.FC<VerificationFormProps> = ({
  phone,
  code,
  isLoading,
  onPhoneChange,
  onCodeChange,
  onSubmit,
}) => {
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Verify Your Booking</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => onPhoneChange(e.target.value)}
                placeholder="Enter the phone number used for booking"
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">Booking Code</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <KeyRound className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder="Enter your 6-digit booking code"
                className="pl-10"
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full bg-burgundy hover:bg-burgundy-light"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Verifying...
              </>
            ) : (
              'Verify Booking'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default VerificationForm;
