
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

// CORS headers for browser clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to send SMS using Twilio API
async function sendTwilioSMS(to: string, body: string) {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
  
  // Detailed logging for debugging environment variables
  console.log('Detailed Twilio configuration check:', {
    accountSid: accountSid || 'not set',
    accountSidType: typeof accountSid,
    accountSidLength: accountSid ? accountSid.length : 0,
    
    authToken: authToken ? '**present**' : 'not set',
    authTokenType: typeof authToken,
    authTokenLength: authToken ? authToken.length : 0,
    
    twilioPhoneNumber: twilioPhoneNumber || 'not set',
    twilioPhoneNumberType: typeof twilioPhoneNumber,
    twilioPhoneNumberLength: twilioPhoneNumber ? twilioPhoneNumber.length : 0
  });
  
  // Enhanced check for Twilio SMS configuration
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.log('Twilio not fully configured. Would send SMS to:', to);
    console.log('Message:', body);
    return {
      success: false,
      message: 'Twilio not fully configured. SMS not sent.',
      isTwilioConfigured: false
    };
  }
  
  try {
    console.log('Attempting to send SMS to:', to);
    // Auth header for Twilio API
    const auth = btoa(`${accountSid}:${authToken}`);
    
    // Make request to Twilio API
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'To': to,
          'From': twilioPhoneNumber,
          'Body': body,
        }),
      }
    );
    
    // Log the complete response for debugging
    const responseText = await response.text();
    console.log('Twilio SMS response status:', response.status);
    console.log('Twilio SMS response headers:', JSON.stringify(Object.fromEntries(response.headers)));
    console.log('Twilio SMS response text:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      result = { error: 'Failed to parse response' };
    }
    
    console.log('Parsed Twilio SMS response:', JSON.stringify(result));
    
    if (!response.ok) {
      throw new Error(result.message || `Error sending SMS (Status: ${response.status})`);
    }
    
    return {
      success: true,
      message: 'SMS sent successfully',
      sid: result.sid,
      isTwilioConfigured: true
    };
  } catch (error) {
    console.error('Error sending SMS via Twilio:', error);
    return {
      success: false,
      message: error.message || 'Error sending SMS',
      isTwilioConfigured: true,
      error: error.toString()
    };
  }
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
    const { phone, name, bookingCode, bookingId, bookingDate, bookingTime } = await req.json();
    console.log('Processing SMS request for:', { phone, name, bookingCode, bookingId });

    // Log environment variables (without showing sensitive values)
    console.log('Environment check:', {
      TWILIO_ACCOUNT_SID: !!Deno.env.get('TWILIO_ACCOUNT_SID'),
      TWILIO_AUTH_TOKEN: !!Deno.env.get('TWILIO_AUTH_TOKEN'),
      TWILIO_PHONE_NUMBER: !!Deno.env.get('TWILIO_PHONE_NUMBER')
    });
    
    // Attempt to log all available environment variables (names only, not values)
    try {
      // @ts-ignore - Deno.env.toObject() might not be available in all Deno versions
      const envVars = Deno.env.toObject ? Object.keys(Deno.env.toObject()) : [];
      console.log('Available environment variables:', envVars);
    } catch (e) {
      console.log('Could not list environment variables:', e.message);
    }

    // Validate input
    if (!phone || !name || !bookingCode || !bookingId || !bookingDate || !bookingTime) {
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

    // Format message
    const message = `Hi ${name}, your booking at TheCut is confirmed for ${bookingDate} at ${bookingTime}. Your booking code is ${bookingCode}. Use this code to manage your booking at our website.`;

    // Send SMS through Twilio
    const smsResult = await sendTwilioSMS(phone, message);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: smsResult.isTwilioConfigured ? 
          'SMS notification sent successfully' : 
          'SMS notification would be sent when Twilio is fully configured',
        to: phone,
        smsContent: message,
        twilioResult: smsResult
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
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
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
