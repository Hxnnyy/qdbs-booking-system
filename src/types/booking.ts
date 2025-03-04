
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
}

export type BookingStep = 'barber' | 'service' | 'datetime' | 'guest-info' | 'notes' | 'confirmation';

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
