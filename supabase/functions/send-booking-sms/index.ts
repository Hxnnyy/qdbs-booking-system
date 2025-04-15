
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from './corsHeaders.ts';
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

// Define type for the request body
interface SMSRequestBody {
  phone: string;
  name: string;
  bookingCode: string;
  bookingId: string;
  bookingDate: string;
  bookingTime: string;
  isUpdate?: boolean;
  isReminder?: boolean;
}

interface TwilioSMSResult {
  success: boolean;
  message: string;
  isTwilioConfigured?: boolean;
  sid?: string;
}

// Helper function to replace template variables
function replaceTemplateVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, 'g'), value || '');
  }
  return result;
}

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

// Helper function to get default SMS template from database
async function getDefaultSmsTemplate(templateType: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('notification_templates')
      .select('content')
      .eq('type', 'sms')
      .eq('is_default', true)
      .single();

    if (error || !data) {
      console.error("Error fetching default SMS template:", error);
      return null;
    }

    return data.content;
  } catch (err) {
    console.error("Error in getDefaultSmsTemplate:", err);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone, name, bookingCode, bookingId, bookingDate, bookingTime, isUpdate, isReminder } = await req.json() as SMSRequestBody;

    // Properly format the phone number for Twilio (E.164 format)
    let formattedPhone = phone;
    
    // If the number starts with 0, replace with +44 (UK)
    if (phone.startsWith('0')) {
      formattedPhone = `+44${phone.substring(1)}`;
    } 
    // If it doesn't already have a + prefix, assume it needs one
    else if (!phone.startsWith('+')) {
      formattedPhone = `+${phone}`;
    }

    console.log(`Formatted phone from ${phone} to ${formattedPhone}`);

    // Format the date for human-readable display
    const dateObj = new Date(bookingDate);
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Check if Twilio credentials are available
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    // If Twilio isn't configured, return mock response
    if (!accountSid || !authToken || !twilioPhone) {
      console.log("Twilio not configured or missing phone number, would have sent SMS to", formattedPhone);
      
      // Return a successful response but indicate Twilio wasn't configured
      return new Response(
        JSON.stringify({
          success: true,
          message: "Twilio not configured, SMS not sent",
          isTwilioConfigured: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200
        }
      );
    }

    // Log Twilio configuration (without exposing auth token)
    console.log(`Using Twilio: Account ${accountSid}, Phone ${twilioPhone}`);

    // Set the correct verification URL
    const verifyUrl = "https://your-website.com/verify-booking";

    // Variables to replace in templates
    const templateVariables = {
      name,
      bookingCode,
      bookingDate: formattedDate,
      bookingTime,
      barberName: '',
      serviceName: ''
    };

    // Prepare the message
    let messageBody;
    
    // Try to get template from database based on message type
    let templateType = 'confirmation';
    if (isReminder) templateType = 'reminder';
    if (isUpdate) templateType = 'update';
    
    const templateContent = await getDefaultSmsTemplate(templateType);
    
    if (templateContent) {
      // Use the template from the database
      messageBody = replaceTemplateVariables(templateContent, templateVariables);
    } else {
      // Fallback to hardcoded templates
      if (isReminder) {
        messageBody = `Hi ${name}, reminder: you have a booking tomorrow (${formattedDate}) at ${bookingTime}. Your booking code is ${bookingCode}. To manage your booking, visit: ${verifyUrl}`;
      } else if (isUpdate) {
        messageBody = `Hi ${name}, your booking has been rescheduled for ${formattedDate} at ${bookingTime}. Your booking code is ${bookingCode}. To manage your booking, visit: ${verifyUrl}`;
      } else {
        messageBody = `Hi ${name}, your booking is confirmed for ${formattedDate} at ${bookingTime}. Your booking code is ${bookingCode}. To manage your booking, visit: ${verifyUrl}`;
      }
    }

    // Send the SMS using Twilio
    const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    console.log(`Sending SMS to ${formattedPhone} from ${twilioPhone} via Twilio...`);
    
    const twilioResponse = await fetch(twilioEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`
      },
      body: new URLSearchParams({
        'To': formattedPhone,
        'From': twilioPhone,
        'Body': messageBody
      })
    });

    const twilioData = await twilioResponse.json();
    
    if (!twilioResponse.ok) {
      console.error(`Twilio error response: ${JSON.stringify(twilioData)}`);
      throw new Error(`Twilio error: ${JSON.stringify(twilioData)}`);
    }

    console.log(`SMS sent successfully with SID: ${twilioData.sid}`);

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: isReminder ? "Booking reminder sent" : 
                 isUpdate ? "Booking update notification sent" : 
                 "Booking confirmation sent",
        isTwilioConfigured: true,
        sid: twilioData.sid
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("Error in send-booking-sms function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Error sending SMS"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
};

serve(handler);
