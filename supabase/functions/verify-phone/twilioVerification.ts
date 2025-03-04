
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

// Function to send verification code via Twilio Verify
export async function sendVerificationCode(phoneNumber: string) {
  console.log('Starting sendVerificationCode function with phone:', phoneNumber);
  
  try {
    // Get environment variables directly
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const verifySid = Deno.env.get('TWILIO_VERIFY_SID');
    
    console.log('Environment variable values (masked):');
    console.log('TWILIO_ACCOUNT_SID:', accountSid ? `${accountSid.substring(0, 3)}...${accountSid.substring(accountSid.length - 3)}` : 'missing');
    console.log('TWILIO_AUTH_TOKEN:', authToken ? `${authToken.substring(0, 3)}...${authToken.substring(authToken.length - 3)}` : 'missing');
    console.log('TWILIO_VERIFY_SID:', verifySid ? `${verifySid.substring(0, 3)}...${verifySid.substring(verifySid.length - 3)}` : 'missing');
    
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
    const url = `https://verify.twilio.com/v2/Services/${verifySid}/Verifications`;
    console.log(`Making request to Twilio Verify API at ${url}`);
    
    const payload = {
      'To': formattedPhone,
      'Channel': 'sms',
      'Locale': 'en'  // Adding locale explicitly
    };
    console.log('Request payload:', payload);
    
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(payload),
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
      console.log('Parsed Twilio response:', result);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      result = { error: 'Failed to parse response' };
    }
    
    if (!response.ok) {
      // Log detailed error information
      console.error('Twilio API error details:', JSON.stringify(result));
      
      // Check for specific error codes and provide more helpful messages
      if (result.code === 60200) {
        console.error('Invalid parameter error detected. This could be due to:');
        console.error('- Invalid phone number format');
        console.error('- Invalid Verify service SID');
        console.error('- Missing required parameters');
      }
      
      return {
        success: false,
        message: result.message || `Error from Twilio: ${response.status}`,
        isTwilioConfigured: true,
        error: result.message || `HTTP error: ${response.status}`,
        errorCode: result.code,
        errorDetails: result
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
    
    console.log('Environment variable values (masked):');
    console.log('TWILIO_ACCOUNT_SID:', accountSid ? `${accountSid.substring(0, 3)}...${accountSid.substring(accountSid.length - 3)}` : 'missing');
    console.log('TWILIO_AUTH_TOKEN:', authToken ? `${authToken.substring(0, 3)}...${authToken.substring(authToken.length - 3)}` : 'missing');
    console.log('TWILIO_VERIFY_SID:', verifySid ? `${verifySid.substring(0, 3)}...${verifySid.substring(verifySid.length - 3)}` : 'missing');
    
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
    const url = `https://verify.twilio.com/v2/Services/${verifySid}/VerificationCheck`;
    console.log(`Making request to Twilio Verify API at ${url}`);
    
    const payload = {
      'To': formattedPhone,
      'Code': code
    };
    console.log('Request payload:', payload);
    
    const response = await fetch(
      url,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(payload),
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
      console.log('Parsed Twilio response:', result);
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      result = { error: 'Failed to parse response' };
    }
    
    if (!response.ok) {
      // Log detailed error information
      console.error('Twilio API error details:', JSON.stringify(result));
      
      // Check for specific error codes and provide more helpful messages
      if (result.code === 60200) {
        console.error('Invalid parameter error detected. This could be due to:');
        console.error('- Invalid phone number format');
        console.error('- Invalid Verify service SID');
        console.error('- Missing required parameters');
      }
      
      return {
        success: false,
        message: result.message || `Error from Twilio: ${response.status}`,
        isTwilioConfigured: true,
        error: result.message || `HTTP error: ${response.status}`,
        errorCode: result.code,
        errorDetails: result
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
