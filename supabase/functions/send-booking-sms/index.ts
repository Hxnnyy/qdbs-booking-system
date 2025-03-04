
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
  
  console.log('Environment variables check for SMS:');
  console.log('TWILIO_ACCOUNT_SID present:', !!accountSid);
  console.log('TWILIO_AUTH_TOKEN present:', !!authToken);
  console.log('TWILIO_PHONE_NUMBER present:', !!twilioPhoneNumber);
  
  // Print actual values for debugging (redacted for security)
  if (accountSid) console.log('TWILIO_ACCOUNT_SID:', accountSid.substring(0, 4) + '...' + accountSid.substring(accountSid.length - 4));
  if (twilioPhoneNumber) console.log('TWILIO_PHONE_NUMBER:', twilioPhoneNumber);
  
  // Enhanced check for Twilio SMS configuration
  if (!accountSid || !authToken || !twilioPhoneNumber) {
    // Log exactly which values are missing
    const missing = [];
    if (!accountSid) missing.push('TWILIO_ACCOUNT_SID');
    if (!authToken) missing.push('TWILIO_AUTH_TOKEN');
    if (!twilioPhoneNumber) missing.push('TWILIO_PHONE_NUMBER');
    
    console.log(`Twilio SMS missing config: ${missing.join(', ')}`);
    console.log('Would send SMS to:', to);
    console.log('Message:', body);
    
    return {
      success: false,
      message: 'Twilio not fully configured. SMS not sent.',
      isTwilioConfigured: false,
      missingConfig: missing
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

    // Log all environment variables (names only, not values) for debugging
    try {
      const envKeys = Object.keys(Deno.env.toObject());
      console.log('All available environment variables:', envKeys);
    } catch (e) {
      console.log('Could not list environment variables:', e);
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
