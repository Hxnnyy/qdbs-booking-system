
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
  subject?: string;
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
      emailTemplate,
      subject
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

    let emailSubject = subject || 'Your Booking Confirmation - Queens Dock Barbershop';
    let emailContent = '';

    // If template string is provided in the request
    if (emailTemplate) {
      emailContent = replaceTemplateVariables(emailTemplate, templateVariables);
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
        emailContent = replaceTemplateVariables(defaultTemplate.content, templateVariables);
      } else {
        // Fallback to hardcoded template
        emailContent = `
          <p>Hello ${name},</p>
          <p>Your appointment has been confirmed. Here are your booking details:</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <div style="margin-bottom: 10px;">
              <strong>Barber:</strong> ${barberName}
            </div>
            <div style="margin-bottom: 10px;">
              <strong>Service:</strong> ${serviceName}
            </div>
            <div style="margin-bottom: 10px;">
              <strong>Date:</strong> ${formattedDate}
            </div>
            <div style="margin-bottom: 10px;">
              <strong>Time:</strong> ${bookingTime}
            </div>
            ${bookingCode ? `
            <div style="margin-bottom: 10px;">
              <strong>Booking Code:</strong> ${bookingCode}
            </div>` : ''}
          </div>
          
          ${bookingCode ? `
          <p>Your booking verification code is:</p>
          <div style="background-color: #f0f0f0; padding: 10px; font-family: monospace; text-align: center; font-weight: bold; letter-spacing: 2px; margin: 20px 0; border-radius: 5px;">${bookingCode}</div>
          <p>Keep this code safe. You'll need it to manage or cancel your booking.</p>` : ''}
          
          <p>We look forward to seeing you at Queens Dock Barbershop!</p>
        `;
      }
    }

    // Wrap the content in our standard email template with same styling as auth emails
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${emailSubject}</title>
          <style>
            body {
              font-family: 'Playfair Display', serif;
              margin: 0;
              padding: 0;
              background-color: #f8f8f8;
              color: #333;
            }
            .email-container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .email-header {
              background-color: #800020; /* Burgundy */
              padding: 24px;
              text-align: center;
            }
            .email-header h1 {
              margin: 0;
              color: white;
              font-size: 28px;
              font-weight: 400;
            }
            .email-body {
              background-color: white;
              padding: 30px;
              border: 1px solid #e9e9e9;
            }
            .email-footer {
              text-align: center;
              padding: 20px;
              font-size: 14px;
              color: #666;
            }
            .button {
              display: inline-block;
              background-color: #800020; /* Burgundy */
              color: white;
              text-decoration: none;
              padding: 12px 24px;
              border-radius: 0;
              margin: 20px 0;
              font-weight: bold;
            }
            .code-container {
              background-color: #f5f5f5;
              padding: 12px;
              text-align: center;
              font-size: 24px;
              letter-spacing: 4px;
              border: 1px solid #e0e0e0;
              font-family: monospace;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="email-header">
              <h1>Queens Dock Barbershop</h1>
            </div>
            <div class="email-body">
              <h2>${emailSubject}</h2>
              ${emailContent}
            </div>
            <div class="email-footer">
              &copy; ${new Date().getFullYear()} Queens Dock Barbershop. All rights reserved.<br>
              52 Bank Street, Rossendale, BB4 8DY<br>
              Phone: 01706 831878
            </div>
          </div>
        </body>
      </html>
    `;

    console.log(`Sending booking confirmation email to ${to} for booking ${bookingId}`);
    
    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'Queens Dock Barbershop <onboarding@resend.dev>',
      to: [to],
      subject: emailSubject,
      html: emailHtml
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
