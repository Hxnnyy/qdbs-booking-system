
// This file contains the implementation of different verification handlers
import { corsHeaders } from './corsHeaders.ts';
import { sendVerificationCode, checkVerificationCode } from './twilioVerification.ts';

// Helper to create error responses with proper CORS headers
export function createErrorResponse(message: string, status = 400) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      message 
    }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Helper to create success responses with proper CORS headers
export function createSuccessResponse(data: any) {
  return new Response(
    JSON.stringify(data),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Handler for sending verification code
export async function handleSendVerification(phone: string) {
  console.log(`Handling send verification request for phone: ${phone}`);
  
  // Use the twilioVerification module to send the code
  const result = await sendVerificationCode(phone);
  console.log('Send verification result:', result);
  
  return result;
}

// Handler for checking verification code
export async function handleCheckVerification(phone: string, code: string) {
  console.log(`Handling check verification request for phone: ${phone} with code: ${code}`);
  
  // Use the twilioVerification module to check the code
  const result = await checkVerificationCode(phone, code);
  console.log('Check verification result:', result);
  
  return result;
}
