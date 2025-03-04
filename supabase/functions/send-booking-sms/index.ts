
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to format phone number to E.164 format (required by Twilio)
function formatPhoneNumber(phoneNumber: string): string {
  // Remove any non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Check if the number starts with + or country code
  if (phoneNumber.startsWith('+')) {
    return phoneNumber; // Already in E.164 format
  }
  
  // If it starts with 0, assume UK number (replace 0 with +44)
  if (digits.startsWith('0')) {
    return '+44' + digits.substring(1);
  }
  
  // If it doesn't have country code, assume US/Canada and add +1
  if (digits.length === 10) {
    return '+1' + digits;
  }
  
  // Otherwise, just add + to the beginning if missing
  return '+' + digits;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('Starting SMS sending function...');
    
    // Get request body
    const { phone, name, bookingCode, bookingId, bookingDate, bookingTime } = await req.json();
    
    if (!phone || !name || !bookingCode) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Get Twilio credentials from environment variables
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER') || '+15005550006'; // Default to Twilio test number
    
    console.log('Environment variable check:');
    console.log('TWILIO_ACCOUNT_SID:', accountSid ? 'exists' : 'missing');
    console.log('TWILIO_AUTH_TOKEN:', authToken ? 'exists' : 'missing');
    console.log('TWILIO_PHONE_NUMBER:', Deno.env.get('TWILIO_PHONE_NUMBER') || 'using default');
    
    // Format message
    const message = `Hello ${name}, your booking with code ${bookingCode} is confirmed for ${bookingDate} at ${bookingTime}. Use this code to manage your booking at any time.`;
    
    // If Twilio credentials are missing, return mock success (for development)
    if (!accountSid || !authToken) {
      console.log('Twilio credentials missing. Would send SMS to:', phone);
      console.log('Message content:', message);
      
      return new Response(
        JSON.stringify({
          success: true,
          mockMode: true,
          message: 'SMS would be sent (mock mode)',
          to: phone,
          messageContent: message
        }),
        { 
          status: 200, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }
    
    // Format the phone number to E.164 for Twilio
    const formattedPhone = formatPhoneNumber(phone);
    console.log('Original phone:', phone);
    console.log('Attempting to send SMS to formatted number:', formattedPhone);
    
    // Create auth header
    const auth = btoa(`${accountSid}:${authToken}`);
    
    // Send SMS using Twilio API
    const twilioResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: fromNumber,
          To: formattedPhone,
          Body: message,
        }),
      }
    );
    
    const twilioData = await twilioResponse.json();
    
    if (!twilioResponse.ok) {
      console.error('Twilio API error:', twilioData);
      throw new Error(twilioData.message || 'Failed to send SMS');
    }
    
    console.log('SMS sent successfully:', twilioData.sid);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'SMS sent successfully',
        sid: twilioData.sid
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  } catch (error) {
    console.error('Error sending SMS:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An unknown error occurred'
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders
        } 
      }
    );
  }
});
