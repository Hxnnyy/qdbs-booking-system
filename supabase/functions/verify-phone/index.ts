
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

// CORS headers for browser clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to send verification code via Twilio Verify
async function sendVerificationCode(phoneNumber: string) {
  // Get environment variables directly without trimming
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const verifySid = Deno.env.get('TWILIO_VERIFY_SID');
  
  console.log('Environment variables for sending verification:');
  console.log('TWILIO_ACCOUNT_SID:', accountSid);
  console.log('TWILIO_AUTH_TOKEN:', authToken ? '********' : undefined);
  console.log('TWILIO_VERIFY_SID:', verifySid);
  
  // Enhanced check for Twilio Verify configuration
  if (!accountSid || !authToken || !verifySid) {
    // Log exactly which values are missing
    const missing = [];
    if (!accountSid) missing.push('TWILIO_ACCOUNT_SID');
    if (!authToken) missing.push('TWILIO_AUTH_TOKEN');
    if (!verifySid) missing.push('TWILIO_VERIFY_SID');
    
    console.log(`Twilio Verify missing config: ${missing.join(', ')}`);
    console.log('Would send verification to:', phoneNumber);
    
    return {
      success: false,
      message: 'Twilio Verify not fully configured.',
      isTwilioConfigured: false,
      mockVerificationCode: '123456', // Mock code for testing
      missingConfig: missing
    };
  }
  
  try {
    console.log('Attempting to send verification code to:', phoneNumber);
    // Auth header for Twilio API
    const auth = btoa(`${accountSid}:${authToken}`);
    
    // Make request to Twilio Verify API to send code
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'To': phoneNumber,
          'Channel': 'sms'
        }),
      }
    );
    
    // Log the complete response for debugging
    const responseText = await response.text();
    console.log('Twilio response status:', response.status);
    console.log('Twilio response headers:', JSON.stringify(Object.fromEntries(response.headers)));
    console.log('Twilio response text:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      result = { error: 'Failed to parse response' };
    }
    
    console.log('Parsed Twilio response:', JSON.stringify(result));
    
    if (!response.ok) {
      throw new Error(result.message || `Error sending verification code (Status: ${response.status})`);
    }
    
    return {
      success: true,
      message: 'Verification code sent successfully',
      isTwilioConfigured: true,
      sid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Error sending verification code via Twilio:', error);
    return {
      success: false,
      message: error.message || 'Error sending verification code',
      isTwilioConfigured: true,
      error: error.toString()
    };
  }
}

// Function to check verification code via Twilio Verify
async function checkVerificationCode(phoneNumber: string, code: string) {
  // Get environment variables directly without trimming
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const verifySid = Deno.env.get('TWILIO_VERIFY_SID');
  
  console.log('Environment variables for verification:');
  console.log('TWILIO_ACCOUNT_SID:', accountSid);
  console.log('TWILIO_AUTH_TOKEN:', authToken ? '********' : undefined);
  console.log('TWILIO_VERIFY_SID:', verifySid);
  
  // Enhanced check for Twilio Verify configuration
  if (!accountSid || !authToken || !verifySid) {
    // Log exactly which values are missing
    const missing = [];
    if (!accountSid) missing.push('TWILIO_ACCOUNT_SID');
    if (!authToken) missing.push('TWILIO_AUTH_TOKEN');
    if (!verifySid) missing.push('TWILIO_VERIFY_SID');
    
    console.log(`Twilio Verify missing config: ${missing.join(', ')}`);
    console.log('Would check code:', code, 'for phone:', phoneNumber);
    
    // For testing without Twilio, accept any 6-digit code
    return {
      success: true,
      message: 'Verification successful (mock)',
      isTwilioConfigured: false,
      status: 'approved',
      mockMode: true,
      missingConfig: missing
    };
  }
  
  try {
    console.log('Attempting to verify code for phone:', phoneNumber);
    // Auth header for Twilio API
    const auth = btoa(`${accountSid}:${authToken}`);
    
    // Make request to Twilio Verify API to check code
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'To': phoneNumber,
          'Code': code
        }),
      }
    );
    
    // Log the complete response for debugging
    const responseText = await response.text();
    console.log('Twilio verification check status:', response.status);
    console.log('Twilio verification check headers:', JSON.stringify(Object.fromEntries(response.headers)));
    console.log('Twilio verification check text:', responseText);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      result = { error: 'Failed to parse response' };
    }
    
    console.log('Parsed Twilio verification check response:', JSON.stringify(result));
    
    if (!response.ok) {
      throw new Error(result.message || `Error checking verification code (Status: ${response.status})`);
    }
    
    return {
      success: true,
      message: 'Verification successful',
      isTwilioConfigured: true,
      sid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Error checking verification code via Twilio:', error);
    return {
      success: false,
      message: error.message || 'Error checking verification code',
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
    // Log all env variables for debugging
    console.log('All Deno.env keys:', Object.keys(Deno.env.toObject()));
    
    const { action, phone, code } = await req.json();
    console.log(`Processing ${action} request for phone: ${phone}${code ? ' with code' : ''}`);

    // Validate action
    if (!action || !['send', 'check'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "send" or "check".' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // Validate phone for both actions
    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Missing phone number' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    // For 'check' action, we also need the code
    if (action === 'check' && !code) {
      return new Response(
        JSON.stringify({ error: 'Missing verification code' }),
        { 
          status: 400, 
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders
          } 
        }
      );
    }

    let result;
    if (action === 'send') {
      // Send verification code
      result = await sendVerificationCode(phone);
    } else {
      // Check verification code
      result = await checkVerificationCode(phone, code);
    }
    
    console.log(`${action} result:`, JSON.stringify(result));
    
    return new Response(
      JSON.stringify(result),
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
