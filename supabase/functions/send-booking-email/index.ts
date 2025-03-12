
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Resend with API key
const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

// Define the request body type
interface EmailRequestBody {
  to: string;
  name: string;
  bookingCode?: string;
  bookingId: string;
  bookingDate: string;
  bookingTime: string;
  barberName: string;
  serviceName: string;
  isGuest: boolean;
  emailTemplate?: string;
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

// Helper function to get default email template from database
async function getDefaultEmailTemplate(supabaseClient: any): Promise<{ subject: string, content: string } | null> {
  try {
    const { data, error } = await supabaseClient
      .from('notification_templates')
      .select('subject, content')
      .eq('type', 'email')
      .eq('is_default', true)
      .single();

    if (error || !data) {
      console.error("Error fetching default email template:", error);
      return null;
    }

    return {
      subject: data.subject || 'Your Booking Confirmation - Queens Dock Barbershop',
      content: data.content
    };
  } catch (err) {
    console.error("Error in getDefaultEmailTemplate:", err);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { 
      to, 
      name, 
      bookingCode, 
      bookingId, 
      bookingDate, 
      bookingTime, 
      barberName, 
      serviceName,
      isGuest,
      emailTemplate
    } = await req.json() as EmailRequestBody;

    // Create a nicely formatted date
    const dateObj = new Date(bookingDate);
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Variables to replace in templates
    const templateVariables = {
      name,
      bookingCode: bookingCode || '',
      bookingDate: formattedDate,
      bookingTime,
      barberName,
      serviceName
    };

    let emailSubject = 'Your Booking Confirmation - Queens Dock Barbershop';
    let emailBody = '';

    // If template string is provided in the request
    if (emailTemplate) {
      emailBody = replaceTemplateVariables(emailTemplate, templateVariables);
    } else {
      // Try to get template from database
      // Connect to Supabase with service role key from environment
      const supabaseClient = await createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );

      const defaultTemplate = await getDefaultEmailTemplate(supabaseClient);
      
      if (defaultTemplate) {
        emailSubject = replaceTemplateVariables(defaultTemplate.subject, templateVariables);
        emailBody = replaceTemplateVariables(defaultTemplate.content, templateVariables);
      } else {
        // Fallback to hardcoded template
        emailBody = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Booking Confirmation</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
                .container { padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px; }
                .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #7a1921; margin-bottom: 20px; }
                .header h1 { color: #7a1921; margin-bottom: 10px; }
                .booking-details { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                .booking-row { display: flex; margin-bottom: 10px; }
                .booking-label { font-weight: bold; width: 120px; }
                .booking-value { flex: 1; }
                .footer { text-align: center; font-size: 14px; color: #888; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e1e1e1; }
                .button { display: inline-block; background-color: #7a1921; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
                .verification-code { background-color: #f0f0f0; padding: 10px; font-family: monospace; text-align: center; font-weight: bold; letter-spacing: 2px; margin: 20px 0; border-radius: 5px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Queens Dock Barbershop</h1>
                  <p>Thank you for booking with us!</p>
                </div>
                
                <p>Hello ${name},</p>
                <p>Your appointment has been confirmed. Here are your booking details:</p>
                
                <div class="booking-details">
                  <div class="booking-row">
                    <div class="booking-label">Barber:</div>
                    <div class="booking-value">${barberName}</div>
                  </div>
                  <div class="booking-row">
                    <div class="booking-label">Service:</div>
                    <div class="booking-value">${serviceName}</div>
                  </div>
                  <div class="booking-row">
                    <div class="booking-label">Date:</div>
                    <div class="booking-value">${formattedDate}</div>
                  </div>
                  <div class="booking-row">
                    <div class="booking-label">Time:</div>
                    <div class="booking-value">${bookingTime}</div>
                  </div>
                  ${bookingCode ? `
                  <div class="booking-row">
                    <div class="booking-label">Booking Code:</div>
                    <div class="booking-value">${bookingCode}</div>
                  </div>` : ''}
                </div>
                
                ${bookingCode ? `
                <p>Your booking verification code is:</p>
                <div class="verification-code">${bookingCode}</div>
                <p>Keep this code safe. You'll need it to manage or cancel your booking.</p>` : ''}
                
                <p>We look forward to seeing you at Queens Dock Barbershop!</p>
                
                <div class="footer">
                  <p>If you have any questions, please contact us.</p>
                  <p>© 2025 Queens Dock Barbershop. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `;
      }
    }

    console.log(`Sending booking confirmation email to ${to} for booking ${bookingId}`);
    
    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Queens Dock Barbershop <onboarding@resend.dev>',
      to: [to],
      subject: emailSubject,
      html: emailBody
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Email sent successfully:', data);

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Booking confirmation email sent",
        data
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );

  } catch (error) {
    console.error("Error in send-booking-email function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Error sending booking email"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
};

// Import the createClient function at the top to avoid TypeScript errors
async function createClient(url: string, key: string) {
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.39.3");
  return createClient(url, key);
}

serve(handler);
