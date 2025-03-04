
import { serve } from "https://deno.land/std@0.131.0/http/server.ts";

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to format phone number to E.164 format (required by Twilio)
function formatPhoneNumber(phoneNumber: string): string {
  console.log('Formatting phone number:', phoneNumber);
  
  // Remove any non-digit characters except the leading +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  console.log('After cleaning:', cleaned);
  
  // Check if the number already starts with +
  if (cleaned.startsWith('+')) {
    console.log('Number already has + prefix:', cleaned);
    return cleaned;
  }
  
  // If it starts with 0, assume UK number (replace 0 with +44)
  if (cleaned.startsWith('0')) {
    const formatted = '+44' + cleaned.substring(1);
    console.log('UK format detected, formatted as:', formatted);
    return formatted;
  }
  
  // If it starts with 44, assume it's a UK number without +
  if (cleaned.startsWith('44')) {
    const formatted = '+' + cleaned;
    console.log('UK format with country code detected, formatted as:', formatted);
    return formatted;
  }
  
  // If it has 10-12 digits but no country code, assume UK number
  if (cleaned.length >= 10 && cleaned.length <= 12 && !cleaned.startsWith('44')) {
    const formatted = '+44' + cleaned;
    console.log('Assuming UK number, formatted as:', formatted);
    return formatted;
  }
  
  // If it doesn't have a +, add it
  if (!cleaned.startsWith('+')) {
    const formatted = '+' + cleaned;
    console.log('Adding + prefix:', formatted);
    return formatted;
  }
  
  console.log('Returning as is:', cleaned);
  return cleaned;
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
    
    console.log('Environment variable values (masked):');
    console.log('TWILIO_ACCOUNT_SID:', accountSid ? `${accountSid.substring(0, 3)}...${accountSid.substring(accountSid.length - 3)}` : 'missing');
    console.log('TWILIO_AUTH_TOKEN:', authToken ? `${authToken.substring(0, 3)}...${authToken.substring(authToken.length - 3)}` : 'missing');
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
    
    // Validate the phone number format before sending
    if (!formattedPhone.match(/^\+[1-9]\d{1,14}$/)) {
      console.error('Invalid phone number format after formatting:', formattedPhone);
      throw new Error('Invalid phone number format. Must be in E.164 format.');
    }
    
    // Create auth header
    const auth = btoa(`${accountSid}:${authToken}`);
    
    // Send SMS using Twilio API
    console.log('Sending SMS to Twilio API with payload:', {
      From: fromNumber,
      To: formattedPhone,
      Body: message
    });
    
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    console.log(`Making request to Twilio API at ${twilioUrl}`);
    
    const twilioResponse = await fetch(
      twilioUrl,
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
    
    // Log the complete response for debugging
    const responseText = await twilioResponse.text();
    console.log('Twilio response status:', twilioResponse.status);
    console.log('Twilio response headers:', JSON.stringify(Object.fromEntries(twilioResponse.headers)));
    console.log('Twilio response text:', responseText);
    
    let twilioData;
    try {
      twilioData = JSON.parse(responseText);
      console.log('Parsed Twilio response:', twilioData);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      twilioData = { error: 'Failed to parse response' };
    }
    
    if (!twilioResponse.ok) {
      console.error('Twilio API error:', twilioData);
      
      // Check for specific error codes and provide more helpful messages
      if (twilioData.code === 21608) {
        console.error('Unregistered or non-SMS capable phone number detected.');
      } else if (twilioData.code === 21211) {
        console.error('Invalid phone number format detected.');
      } else if (twilioData.code === 21606) {
        console.error('The From phone number is not a valid, SMS-capable Twilio phone number.');
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          message: twilioData.message || 'Failed to send SMS',
          error: twilioData
        }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
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
