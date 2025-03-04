
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
  
  // Check if Twilio is fully configured
  const isTwilioConfigured = accountSid && authToken && twilioPhoneNumber && twilioPhoneNumber.trim() !== '';
  
  if (!isTwilioConfigured) {
    console.log('Twilio not fully configured. Would send SMS to:', to);
    console.log('Message:', body);
    return {
      success: false,
      message: 'Twilio not fully configured. SMS not sent.',
      isTwilioConfigured: false
    };
  }
  
  try {
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
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Error sending SMS');
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
      isTwilioConfigured: true
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
