
import { Service } from '@/supabase-types';

export interface TimeSlotProps {
  time: string;
  selected: string;
  onClick: () => void;
  disabled?: boolean;
}

export interface BookingStepProps {
  onNext: () => void;
  onBack?: () => void;
}

export interface BookingFormState {
  selectedBarber: string | null;
  selectedService: string | null;
  selectedDate: Date | undefined;
  selectedTime: string | null;
  guestName: string;
  guestPhone: string;
  notes: string;
  selectedServiceDetails: Service | null;
  isPhoneVerified: boolean;
  bookingComplete?: boolean;
  verificationId?: string;
}

export type BookingStep = 'barber' | 'service' | 'datetime' | 'guest-info' | 'verify-phone' | 'notes' | 'confirmation';

export interface ExistingBooking {
  booking_time: string;
  service_id: string;
  services: {
    duration: number;
  };
}

export interface TwilioSMSResult {
  success: boolean;
  message: string;
  isTwilioConfigured?: boolean;
  sid?: string;
}

export interface VerifyPhoneResult {
  success: boolean;
  message: string;
  isTwilioConfigured?: boolean;
  status?: string;
  sid?: string;
  mockVerificationCode?: string;
  mockMode?: boolean;
}

// Adding new types needed for BookingStepRenderer
export interface BookingStepHandlers {
  handleSelectBarber: (barberId: string) => void;
  handleSelectService: (serviceId: string) => void;
  handleBackToBarbers: () => void;
  handleBackToServices: () => void;
  handleDateTimeComplete: () => void;
  handleBackToDateTime: () => void;
  handleGuestInfoComplete: () => void;
  handleBackToGuestInfo: () => void;
  handleVerificationComplete: () => void;
  handleBackToVerification: () => void;
  handleSubmit: (e: React.FormEvent) => void;
}

export interface BookingResult {
  id: string;
  bookingCode?: string;
  twilioResult?: TwilioSMSResult;
  [key: string]: any;
}
