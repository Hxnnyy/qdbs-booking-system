
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, ArrowRight, Lock } from 'lucide-react';
import { BookingStepProps, VerifyPhoneResult } from '@/types/booking';
import { Spinner } from '@/components/ui/spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VerifyPhoneStepProps extends BookingStepProps {
  phone: string;
  isVerified: boolean;
  setIsVerified: (verified: boolean) => void;
}

const VerifyPhoneStep: React.FC<VerifyPhoneStepProps> = ({ 
  phone, 
  isVerified,
  setIsVerified,
  onNext,
  onBack
}) => {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [mockCode, setMockCode] = useState<string | null>(null);

  // Send verification code on first load
  useEffect(() => {
    if (!isVerified) {
      sendVerificationCode();
    }
  }, []);

  const sendVerificationCode = async () => {
    if (!phone) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsSendingCode(true);
    try {
      const { error, data } = await supabase.functions.invoke('verify-phone', {
        body: {
          action: 'send',
          phone: phone
        }
      });

      if (error) {
        console.error('Error sending verification code:', error);
        toast.error('Failed to send verification code');
        return;
      }

      const result = data as VerifyPhoneResult;
      
      if (result.success) {
        toast.success('Verification code sent to your phone');
        setCodeSent(true);
        
        if (result.mockVerificationCode) {
          setMockCode(result.mockVerificationCode);
          toast.info(`Using mock code: ${result.mockVerificationCode} (Twilio not configured)`);
        }
      } else {
        toast.error(result.message || 'Failed to send verification code');
      }
    } catch (err: any) {
      console.error('Error in sendVerificationCode:', err);
      toast.error(err.message || 'Failed to send verification code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const verifyCode = async () => {
    if (!verificationCode || verificationCode.trim().length === 0) {
      toast.error('Please enter the verification code');
      return;
    }

    setIsVerifying(true);
    try {
      const { error, data } = await supabase.functions.invoke('verify-phone', {
        body: {
          action: 'check',
          phone: phone,
          code: verificationCode
        }
      });

      if (error) {
        console.error('Error verifying code:', error);
        toast.error('Failed to verify code');
        return;
      }

      const result = data as VerifyPhoneResult;
      
      if (result.success && (result.status === 'approved' || result.mockMode)) {
        toast.success('Phone number verified successfully');
        setIsVerified(true);
        // Proceed to the next step
        onNext();
      } else {
        toast.error(result.message || 'Invalid verification code');
      }
    } catch (err: any) {
      console.error('Error in verifyCode:', err);
      toast.error(err.message || 'Failed to verify code');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto">
        <div className="space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Lock className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  We've sent a verification code to <span className="font-medium">{phone}</span>.
                  Enter it below to verify your phone number.
                </p>
              </div>
            </div>
          </div>

          {mockCode && (
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
              <p className="text-sm text-blue-700">
                Test Mode: Use code <span className="font-bold">{mockCode}</span>
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="verificationCode">Verification Code</Label>
            <Input
              id="verificationCode"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Enter the 6-digit code"
              className="text-center text-lg tracking-widest"
              maxLength={6}
            />
          </div>
          
          <Button 
            type="button" 
            variant="outline"
            className="w-full"
            onClick={sendVerificationCode}
            disabled={isSendingCode}
          >
            {isSendingCode ? (
              <>
                <Spinner className="mr-2 h-4 w-4" /> Sending...
              </>
            ) : (
              'Resend Code'
            )}
          </Button>
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
          onClick={verifyCode}
          className="bg-burgundy hover:bg-burgundy-light flex items-center gap-2"
          disabled={isVerifying || !codeSent}
        >
          {isVerifying ? (
            <>
              <Spinner className="mr-2 h-4 w-4 border-2 border-white" /> Verifying...
            </>
          ) : (
            <>Verify & Continue <ArrowRight className="h-4 w-4" /></>
          )}
        </Button>
      </div>
    </>
  );
};

export default VerifyPhoneStep;
