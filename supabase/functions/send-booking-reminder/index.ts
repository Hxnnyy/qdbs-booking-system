
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRequestBody {
  specificBookingId?: string; // Optional - to send a reminder for a specific booking
  testMode?: boolean; // For testing purposes
}

interface BookingWithDetails {
  id: string;
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  user_id: string;
  notes: string | null;
  status: string;
  guest_booking: boolean;
  guest_name?: string;
  guest_phone?: string;
  barber: { name: string };
  service: { name: string; price: number; duration: number };
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// Function to format phone number to E.164 format
const formatPhoneNumber = (phone: string): string => {
  if (!phone) return "";
  
  // If the number starts with 0, replace with +44 (UK)
  if (phone.startsWith('0')) {
    return `+44${phone.substring(1)}`;
  } 
  // If it doesn't already have a + prefix, assume it needs one
  else if (!phone.startsWith('+')) {
    return `+${phone}`;
  }
  
  return phone;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { specificBookingId, testMode } = await req.json() as ReminderRequestBody;
    
    // Calculate tomorrow's date (for reminders 24 hours in advance)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowFormatted = tomorrow.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    console.log(`Looking for bookings on: ${tomorrowFormatted}`);
    
    // Query to get bookings that are scheduled for tomorrow
    let query = supabase
      .from('bookings')
      .select(`
        *,
        barber:barber_id(name),
        service:service_id(name, price, duration)
      `)
      .eq('status', 'confirmed');
    
    // If specific booking ID is provided, use that instead of tomorrow's date
    if (specificBookingId) {
      query = query.eq('id', specificBookingId);
    } else if (!testMode) {
      // In normal mode, get bookings for tomorrow
      query = query.eq('booking_date', tomorrowFormatted);
    }
    
    const { data: bookings, error } = await query;
    
    if (error) {
      throw new Error(`Error fetching bookings: ${error.message}`);
    }
    
    console.log(`Found ${bookings?.length || 0} bookings to send reminders for`);
    
    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No reminders to send", count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Process each booking and send an SMS reminder
    const results = await Promise.all(
      bookings.map(async (booking: BookingWithDetails) => {
        try {
          // Determine phone number and name based on whether it's a guest booking
          let phone = "";
          let name = "";
          let bookingCode = "";
          let barberName = booking.barber?.name || "";
          let serviceName = booking.service?.name || "";
          
          if (booking.guest_booking) {
            // For guest bookings, extract phone and name from notes
            const notes = booking.notes || "";
            
            // Extract the phone number and name from notes
            const phoneMatch = notes.match(/\(([^)]+)\)/);
            phone = phoneMatch ? phoneMatch[1] : "";
            
            const nameMatch = notes.match(/Guest booking by ([^(]+) \(/);
            name = nameMatch ? nameMatch[1].trim() : "Guest";
            
            // Extract the booking code
            const codeMatch = notes.match(/Verification code: (\d+)/);
            bookingCode = codeMatch ? codeMatch[1] : "";
          } else {
            // For regular user bookings, get details from profiles table
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('first_name, last_name, phone')
              .eq('id', booking.user_id)
              .single();
              
            if (profileError || !profile) {
              console.error(`No profile found for user ${booking.user_id}`);
              return { booking_id: booking.id, success: false, message: "User profile not found" };
            }
            
            name = profile.first_name || "Customer";
            phone = profile.phone || "";
            
            // Generate a simple booking reference (you might want to store this in the DB)
            bookingCode = booking.id.substring(0, 6);
          }
          
          // Skip if no phone number is available
          if (!phone) {
            return { booking_id: booking.id, success: false, message: "No phone number available" };
          }
          
          // Format the phone number to E.164 format
          const formattedPhone = formatPhoneNumber(phone);
          console.log(`Formatting phone number from ${phone} to ${formattedPhone}`);
          
          // Prepare and send the SMS via the send-booking-sms function
          const { error: smsError } = await supabase.functions.invoke('send-booking-sms', {
            body: {
              phone: formattedPhone,
              name: name,
              bookingCode: bookingCode,
              bookingId: booking.id,
              bookingDate: booking.booking_date,
              bookingTime: booking.booking_time,
              barberName: barberName,
              serviceName: serviceName,
              isReminder: true
            }
          });
          
          if (smsError) {
            console.error(`Error sending SMS for booking ${booking.id}:`, smsError);
            return { booking_id: booking.id, success: false, message: smsError.message };
          }
          
          return { booking_id: booking.id, success: true, message: "Reminder sent successfully" };
        } catch (err) {
          console.error(`Error processing booking ${booking.id}:`, err);
          return { booking_id: booking.id, success: false, message: err.message };
        }
      })
    );
    
    // Return the results
    const successCount = results.filter(r => r.success).length;
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${successCount} reminders out of ${results.length} bookings`,
        results: results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in send-booking-reminder function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Error sending reminders"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
};

serve(handler);
