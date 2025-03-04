
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Lock, AlertTriangle } from 'lucide-react';

interface VerificationCodeInputProps {
  verificationCode: string;
  setVerificationCode: (code: string) => void;
  isSendingCode: boolean;
  sendVerificationCode: () => void;
  mockCode: string | null;
  phone: string;
}

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({
  verificationCode,
  setVerificationCode,
  isSendingCode,
  sendVerificationCode,
  mockCode,
  phone
}) => {
  return (
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
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Test Mode: Use code <span className="font-bold">{mockCode}</span>
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Twilio is not fully configured, but you can proceed with this test code.
                </p>
              </div>
            </div>
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
  );
};

export default VerificationCodeInput;
