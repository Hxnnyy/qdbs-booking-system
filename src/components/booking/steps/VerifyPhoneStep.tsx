
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { BookingStepProps } from '@/types/booking';
import { Spinner } from '@/components/ui/spinner';
import { useVerificationCode } from '@/hooks/useVerificationCode';
import VerificationCodeInput from './verification/VerificationCodeInput';

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
  const {
    verificationCode,
    setVerificationCode,
    isSendingCode,
    isVerifying,
    codeSent,
    mockCode,
    sendVerificationCode,
    verifyCode
  } = useVerificationCode({
    phone,
    onVerificationComplete: () => {
      setIsVerified(true);
      onNext();
    }
  });

  return (
    <>
      <VerificationCodeInput
        verificationCode={verificationCode}
        setVerificationCode={setVerificationCode}
        isSendingCode={isSendingCode}
        sendVerificationCode={sendVerificationCode}
        mockCode={mockCode}
        phone={phone}
      />
      
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
