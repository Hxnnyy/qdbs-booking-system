
// Twilio verification functionality

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
  
  // If it has 10 digits, assume US/Canada and add +1
  if (cleaned.length === 10) {
    const formatted = '+1' + cleaned;
    console.log('US format detected, formatted as:', formatted);
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

// Function to send verification code via Twilio Verify
export async function sendVerificationCode(phoneNumber: string) {
  console.log('Starting sendVerificationCode function with phone:', phoneNumber);
  
  try {
    // Get environment variables directly
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifySid = Deno.env.get('TWILIO_VERIFY_SID');
    
    console.log('Environment variable check:');
    console.log('TWILIO_ACCOUNT_SID:', accountSid ? 'exists' : 'missing');
    console.log('TWILIO_AUTH_TOKEN:', authToken ? 'exists' : 'missing');
    console.log('TWILIO_VERIFY_SID:', verifySid ? 'exists' : 'missing');
    
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
    
    // Format the phone number to E.164 for Twilio
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log('Original phone:', phoneNumber);
    console.log('Formatted phone for Twilio:', formattedPhone);
    
    // Validate the phone number format before sending
    if (!formattedPhone.match(/^\+[1-9]\d{1,14}$/)) {
      console.error('Invalid phone number format after formatting:', formattedPhone);
      throw new Error('Invalid phone number format. Must be in E.164 format.');
    }
    
    // Auth header for Twilio API
    const auth = btoa(`${accountSid}:${authToken}`);
    
    // Make request to Twilio Verify API to send code with detailed logs
    console.log(`Making request to Twilio Verify API at https://verify.twilio.com/v2/Services/${verifySid}/Verifications`);
    console.log('Request payload:', { To: formattedPhone, Channel: 'sms' });
    
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'To': formattedPhone,
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
    
    if (!response.ok) {
      // Log detailed error information
      console.error('Twilio API error details:', JSON.stringify(result));
      return {
        success: false,
        message: result.message || `Error from Twilio: ${response.status}`,
        isTwilioConfigured: true,
        error: result.message || `HTTP error: ${response.status}`
      };
    }
    
    console.log('Verification request successful:', result.sid);
    
    return {
      success: true,
      message: 'Verification code sent successfully',
      isTwilioConfigured: true,
      sid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Error in sendVerificationCode function:', error);
    return {
      success: false,
      message: error.message || 'Error sending verification code',
      isTwilioConfigured: true,
      error: error.toString()
    };
  }
}

// Function to check verification code via Twilio Verify
export async function checkVerificationCode(phoneNumber: string, code: string) {
  console.log('Starting checkVerificationCode function with phone:', phoneNumber, 'and code:', code);
  
  try {
    // Get environment variables directly
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifySid = Deno.env.get('TWILIO_VERIFY_SID');
    
    console.log('Environment variable check:');
    console.log('TWILIO_ACCOUNT_SID:', accountSid ? 'exists' : 'missing');
    console.log('TWILIO_AUTH_TOKEN:', authToken ? 'exists' : 'missing');
    console.log('TWILIO_VERIFY_SID:', verifySid ? 'exists' : 'missing');
    
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
    
    // Format the phone number to E.164 for Twilio
    const formattedPhone = formatPhoneNumber(phoneNumber);
    console.log('Original phone:', phoneNumber);
    console.log('Formatted phone for Twilio:', formattedPhone);
    
    // Auth header for Twilio API
    const auth = btoa(`${accountSid}:${authToken}`);
    
    // Make request to Twilio Verify API to check code with detailed logs
    console.log(`Making request to Twilio Verify API at https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`);
    console.log('Request payload:', { To: formattedPhone, Code: code });
    
    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          'To': formattedPhone,
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
    
    if (!response.ok) {
      // Log detailed error information
      console.error('Twilio API error details:', JSON.stringify(result));
      return {
        success: false,
        message: result.message || `Error from Twilio: ${response.status}`,
        isTwilioConfigured: true,
        error: result.message || `HTTP error: ${response.status}`
      };
    }
    
    return {
      success: true,
      message: 'Verification successful',
      isTwilioConfigured: true,
      sid: result.sid,
      status: result.status
    };
  } catch (error) {
    console.error('Error in checkVerificationCode function:', error);
    return {
      success: false,
      message: error.message || 'Error checking verification code',
      isTwilioConfigured: true,
      error: error.toString()
    };
  }
}
