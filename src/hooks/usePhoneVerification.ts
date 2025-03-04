
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { VerifyPhoneResult } from '@/types/booking';

export const usePhoneVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mockCode, setMockCode] = useState<string | null>(null);

  const sendVerificationCode = async (phone: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error, data } = await supabase.functions.invoke('verify-phone', {
        body: {
          action: 'send',
          phone
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send verification code');
      }

      const result = data as VerifyPhoneResult;
      
      if (result.mockVerificationCode) {
        setMockCode(result.mockVerificationCode);
      }
      
      return result;
    } catch (err: any) {
      console.error('Error in sendVerificationCode:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to send verification code');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyCode = async (phone: string, code: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const { error, data } = await supabase.functions.invoke('verify-phone', {
        body: {
          action: 'check',
          phone,
          code
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to verify code');
      }

      const result = data as VerifyPhoneResult;
      return result;
    } catch (err: any) {
      console.error('Error in verifyCode:', err);
      setError(err.message);
      toast.error(err.message || 'Failed to verify code');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendVerificationCode,
    verifyCode,
    mockCode,
    isLoading,
    error
  };
};
