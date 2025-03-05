
// Guest booking related types
export interface GuestBookingData {
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  guest_name: string;
  guest_phone: string;
  notes?: string;
}

export interface GuestBookingResult {
  bookingData: any;
  bookingCode: string;
  twilioResult: {
    success: boolean;
    message: string;
    isTwilioConfigured: boolean;
  };
}
