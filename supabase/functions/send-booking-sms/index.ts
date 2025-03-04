
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';

// CORS headers for browser clients
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// This would use a real SMS service like Twilio in production.
// For now, we'll just log the message that would be sent.
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

    // This would send an SMS in production using a service like Twilio
    console.log('Would send SMS:', message);
    console.log('To phone number:', phone);

    // For now, just return a success response
    // In production, replace this with actual SMS sending logic and return the provider's response
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS notification would be sent in production',
        to: phone,
        smsContent: message
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
