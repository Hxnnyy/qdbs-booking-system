
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VerifyPhoneResult } from '@/types/booking';

interface UseVerificationCodeProps {
  phone: string;
  onVerificationComplete: () => void;
}

export const useVerificationCode = ({ phone, onVerificationComplete }: UseVerificationCodeProps) => {
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isSendingCode, setIsSendingCode] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [codeSent, setCodeSent] = useState<boolean>(false);
  const [mockCode, setMockCode] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState<boolean>(false);

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
        onVerificationComplete();
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

  return {
    verificationCode,
    setVerificationCode,
    isSendingCode,
    isVerifying,
    codeSent,
    mockCode,
    isVerified,
    sendVerificationCode,
    verifyCode
  };
};
