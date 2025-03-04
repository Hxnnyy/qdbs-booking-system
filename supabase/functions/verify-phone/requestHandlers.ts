
import { corsHeaders } from './corsHeaders.ts';
import { sendVerificationCode, checkVerificationCode } from './twilioVerification.ts';

// Handler for the 'send' action
export async function handleSendVerification(phone: string) {
  return await sendVerificationCode(phone);
}

// Handler for the 'check' action
export async function handleCheckVerification(phone: string, code: string) {
  return await checkVerificationCode(phone, code);
}

// Helper function to create error responses
export function createErrorResponse(message: string, status: number = 400) {
  return new Response(
    JSON.stringify({ error: message }),
    { 
      status, 
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      } 
    }
  );
}

// Helper function to create success responses
export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      status: 200, 
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders
      } 
    }
  );
}
