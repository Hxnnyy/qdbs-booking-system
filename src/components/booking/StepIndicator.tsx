
import React from 'react';
import { BookingStep } from '@/types/booking';

interface StepIndicatorProps {
  currentStep: BookingStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        currentStep === 'barber' 
          ? 'bg-burgundy text-white' 
          : currentStep === 'service' || currentStep === 'datetime' || currentStep === 'guest-info' || currentStep === 'notes' || currentStep === 'confirmation'
            ? 'bg-burgundy text-white' 
            : 'bg-gray-200 text-gray-600'
      }`}>1</div>
      
      <div className={`h-1 w-8 ${
        currentStep === 'service' || currentStep === 'datetime' || currentStep === 'guest-info' || currentStep === 'notes' || currentStep === 'confirmation'
          ? 'bg-burgundy' 
          : 'bg-gray-200'
      }`}></div>
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        currentStep === 'service' 
          ? 'bg-burgundy text-white' 
          : currentStep === 'datetime' || currentStep === 'guest-info' || currentStep === 'notes' || currentStep === 'confirmation'
            ? 'bg-burgundy text-white' 
            : 'bg-gray-200 text-gray-600'
      }`}>2</div>
      
      <div className={`h-1 w-8 ${
        currentStep === 'datetime' || currentStep === 'guest-info' || currentStep === 'notes' || currentStep === 'confirmation'
          ? 'bg-burgundy' 
          : 'bg-gray-200'
      }`}></div>
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        currentStep === 'datetime' 
          ? 'bg-burgundy text-white' 
          : currentStep === 'guest-info' || currentStep === 'notes' || currentStep === 'confirmation'
            ? 'bg-burgundy text-white' 
            : 'bg-gray-200 text-gray-600'
      }`}>3</div>
      
      <div className={`h-1 w-8 ${
        currentStep === 'guest-info' || currentStep === 'notes' || currentStep === 'confirmation'
          ? 'bg-burgundy' 
          : 'bg-gray-200'
      }`}></div>
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        currentStep === 'guest-info' 
          ? 'bg-burgundy text-white' 
          : currentStep === 'notes' || currentStep === 'confirmation'
            ? 'bg-burgundy text-white' 
            : 'bg-gray-200 text-gray-600'
      }`}>4</div>
      
      <div className={`h-1 w-8 ${
        currentStep === 'notes' || currentStep === 'confirmation'
          ? 'bg-burgundy' 
          : 'bg-gray-200'
      }`}></div>
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        currentStep === 'notes' 
          ? 'bg-burgundy text-white' 
          : currentStep === 'confirmation'
            ? 'bg-burgundy text-white' 
            : 'bg-gray-200 text-gray-600'
      }`}>5</div>
    </div>
  );
};

export default StepIndicator;
