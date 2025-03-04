
import React from 'react';
import { BookingStep } from '@/types/booking';
import { cn } from '@/lib/utils';

interface StepIndicatorProps {
  currentStep: BookingStep;
}

// Array of steps in order
const steps: BookingStep[] = [
  'barber',
  'service',
  'datetime',
  'guest-info',
  'verify-phone',
  'notes',
  'confirmation'
];

// Helper function to determine if a step is active or complete
const isStepActiveOrComplete = (stepIndex: number, currentStepIndex: number): boolean => {
  return stepIndex <= currentStepIndex;
};

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const currentStepIndex = steps.indexOf(currentStep);
  
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <React.Fragment key={step}>
          {/* Step Circle */}
          <div 
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              isStepActiveOrComplete(index, currentStepIndex)
                ? "bg-burgundy text-white"
                : "bg-gray-200 text-gray-600"
            )}
          >
            {index + 1}
          </div>
          
          {/* Connector Line (don't render after the last step) */}
          {index < steps.length - 1 && (
            <div 
              className={cn(
                "h-1 w-8",
                isStepActiveOrComplete(index + 1, currentStepIndex)
                  ? "bg-burgundy"
                  : "bg-gray-200"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;
