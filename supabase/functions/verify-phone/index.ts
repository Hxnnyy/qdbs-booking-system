
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { corsHeaders } from './corsHeaders.ts';
import { 
  handleSendVerification, 
  handleCheckVerification,
  createErrorResponse,
  createSuccessResponse
} from './requestHandlers.ts';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    console.log('=== STARTING VERIFY-PHONE FUNCTION ===');
    console.log('All environment variables available to the function:');
    const envVars = Object.keys(Deno.env.toObject());
    console.log('Environment variable keys:', envVars);
    console.log('TWILIO_ACCOUNT_SID exists:', envVars.includes('TWILIO_ACCOUNT_SID'));
    console.log('TWILIO_AUTH_TOKEN exists:', envVars.includes('TWILIO_AUTH_TOKEN'));
    console.log('TWILIO_VERIFY_SID exists:', envVars.includes('TWILIO_VERIFY_SID'));
    
    const { action, phone, code } = await req.json();
    console.log(`Processing ${action} request for phone: ${phone}${code ? ' with code' : ''}`);

    // Validate action
    if (!action || !['send', 'check'].includes(action)) {
      return createErrorResponse('Invalid action. Use "send" or "check".');
    }

    // Validate phone for both actions
    if (!phone) {
      return createErrorResponse('Missing phone number');
    }

    // For 'check' action, we also need the code
    if (action === 'check' && !code) {
      return createErrorResponse('Missing verification code');
    }

    let result;
    if (action === 'send') {
      // Send verification code
      result = await handleSendVerification(phone);
    } else {
      // Check verification code
      result = await handleCheckVerification(phone, code);
    }
    
    console.log(`${action} result:`, JSON.stringify(result));
    
    return createSuccessResponse(result);
  } catch (error) {
    console.error('Error processing request:', error);
    
    return createErrorResponse(error.message || 'Internal server error', 500);
  }
});
