
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const fetchBookingsData = async () => {
  try {
    // Get all bookings to extract client information
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('id, user_id, guest_booking, guest_email, notes, barber_id, service_id')
      .order('created_at', { ascending: false });

    if (bookingsError) throw bookingsError;
    
    return bookings;
  } catch (err: any) {
    console.error('Error fetching bookings data:', err);
    toast.error('Failed to load booking data');
    throw err;
  }
};
