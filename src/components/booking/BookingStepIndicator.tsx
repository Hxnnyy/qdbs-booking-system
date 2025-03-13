
import React from 'react';
import { BookingStep } from '@/hooks/useBookingFlow';

interface BookingStepIndicatorProps {
  currentStep: BookingStep;
}

const BookingStepIndicator: React.FC<BookingStepIndicatorProps> = ({ currentStep }) => {
  return (
    <div className="flex items-center justify-center mb-8">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        currentStep === 'barber' 
          ? 'bg-burgundy text-white' 
          : currentStep === 'service' || currentStep === 'datetime' || currentStep === 'notes' 
            ? 'bg-burgundy text-white' 
            : 'bg-gray-200 text-gray-600'
      }`}>1</div>
      
      <div className={`h-1 w-12 ${
        currentStep === 'service' || currentStep === 'datetime' || currentStep === 'notes' 
          ? 'bg-burgundy' 
          : 'bg-gray-200'
      }`}></div>
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        currentStep === 'service' 
          ? 'bg-burgundy text-white' 
          : currentStep === 'datetime' || currentStep === 'notes' 
            ? 'bg-burgundy text-white' 
            : 'bg-gray-200 text-gray-600'
      }`}>2</div>
      
      <div className={`h-1 w-12 ${
        currentStep === 'datetime' || currentStep === 'notes' 
          ? 'bg-burgundy' 
          : 'bg-gray-200'
      }`}></div>
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        currentStep === 'datetime' 
          ? 'bg-burgundy text-white' 
          : currentStep === 'notes' 
            ? 'bg-burgundy text-white' 
            : 'bg-gray-200 text-gray-600'
      }`}>3</div>
      
      <div className={`h-1 w-12 ${
        currentStep === 'notes' 
          ? 'bg-burgundy' 
          : 'bg-gray-200'
      }`}></div>
      
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        currentStep === 'notes' 
          ? 'bg-burgundy text-white' 
          : 'bg-gray-200 text-gray-600'
      }`}>4</div>
    </div>
  );
};

export default BookingStepIndicator;
