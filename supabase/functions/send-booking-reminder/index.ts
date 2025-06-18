
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderRequestBody {
  specificBookingId?: string; // Optional - to send a reminder for a specific booking
  testMode?: boolean; // For testing purposes
  testPhone?: string; // Phone number for test reminders
  days_before?: number; // Days before the appointment to look for
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

// Helper function to get SMS reminder template from database
async function getSMSReminderTemplate(): Promise<string | null> {
  try {
    // Try to get the SMS reminder template from system settings
    const { data: settingsData, error: settingsError } = await supabase.functions.invoke('create-system-settings-table', {
      body: { action: 'get_settings', setting_type: 'sms_reminder_template' }
    });

    if (!settingsError && settingsData && settingsData.settings) {
      console.log('Using custom SMS reminder template from system settings');
      return settingsData.settings.content;
    }

    // Fallback to notification templates table
    const { data, error } = await supabase
      .from('notification_templates')
      .select('content')
      .eq('type', 'sms')
      .eq('is_default', true)
      .single();

    if (!error && data) {
      console.log('Using SMS template from notification_templates table');
      return data.content;
    }

    console.log("No custom SMS reminder template found, using fallback");
    return null;
  } catch (err) {
    console.error("Error getting SMS reminder template:", err);
    return null;
  }
}

// Helper function to replace template variables
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  }
  return result;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { specificBookingId, testMode, testPhone, days_before = 1 } = await req.json() as ReminderRequestBody;
    
    // For test mode with a phone number, send a test reminder with dummy data
    if (testMode && testPhone) {
      console.log(`Sending test reminder to: ${testPhone}`);
      
      // Get the SMS reminder template
      const templateContent = await getSMSReminderTemplate();
      
      // Create dummy appointment data
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const formattedDate = tomorrow.toLocaleDateString('en-GB', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      const templateVariables = {
        name: "Test Customer",
        bookingCode: "TEST123",
        bookingDate: formattedDate,
        bookingTime: "14:00",
        barberName: "Test Barber",
        serviceName: "Test Haircut"
      };

      let messageBody;
      if (templateContent) {
        messageBody = replaceTemplateVariables(templateContent, templateVariables);
        console.log('Using custom template for test reminder');
      } else {
        // Fallback message
        messageBody = `Hi ${templateVariables.name}, reminder: you have a booking tomorrow (${templateVariables.bookingDate}) at ${templateVariables.bookingTime} with ${templateVariables.barberName} for ${templateVariables.serviceName}. Your booking code is ${templateVariables.bookingCode}. To manage your booking, visit: https://queensdockbarbershop.co.uk/verify-booking`;
        console.log('Using fallback template for test reminder');
      }
      
      // Send directly via Twilio for test
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

      if (!accountSid || !authToken || !twilioPhone) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: `Test reminder would be sent to ${testPhone} (Twilio not configured)`,
            results: [{ booking_id: 'test-booking-id', success: true, message: "Test reminder (mock)" }]
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const formattedPhone = formatPhoneNumber(testPhone);
      const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      
      const twilioResponse = await fetch(twilioEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
        },
        body: new URLSearchParams({
          'To': formattedPhone,
          'From': twilioPhone,
          'Body': messageBody
        })
      });

      if (!twilioResponse.ok) {
        throw new Error('Failed to send test SMS via Twilio');
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Test reminder SMS sent to ${testPhone}`,
          results: [{ booking_id: 'test-booking-id', success: true, message: "Test reminder sent" }]
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Calculate the target date based on days_before
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + days_before);
    const targetDateFormatted = targetDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    console.log(`Looking for bookings on: ${targetDateFormatted} (${days_before} days from now)`);
    
    // Query to get bookings that are scheduled for the target date
    let query = supabase
      .from('bookings')
      .select(`
        *,
        barber:barber_id(name),
        service:service_id(name, price, duration)
      `)
      .eq('status', 'confirmed');
    
    // If specific booking ID is provided, use that instead of the target date
    if (specificBookingId) {
      query = query.eq('id', specificBookingId);
    } else if (!testMode) {
      // In normal mode, get bookings for the target date
      query = query.eq('booking_date', targetDateFormatted);
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
              .select('first_name, last_name, phone, email')
              .eq('id', booking.user_id)
              .single();
              
            if (profileError || !profile) {
              console.error(`No profile found for user ${booking.user_id}`);
              return { booking_id: booking.id, success: false, message: "User profile not found" };
            }
            
            name = profile.first_name 
              ? `${profile.first_name} ${profile.last_name || ''}`.trim()
              : profile.email?.split('@')[0] || "Customer";
            
            phone = profile.phone || "";
            
            // Generate a simple booking reference from booking ID
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
