
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

// Create enhanced HTML email template
function createBookingConfirmationEmail(
  name: string,
  bookingCode: string,
  bookingDate: string,
  bookingTime: string,
  barberName: string,
  serviceName: string,
  isGuest: boolean,
  managementLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmation - Queens Dock Barbershop</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f8f9fa;
            color: #333;
            line-height: 1.6;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .email-header {
            background: linear-gradient(135deg, #800020 0%, #a0002a 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          .email-header h1 {
            margin: 0;
            font-size: 32px;
            font-weight: 300;
            letter-spacing: 1px;
          }
          .email-header .subtitle {
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
          }
          .email-body {
            padding: 40px 30px;
          }
          .confirmation-badge {
            background-color: #28a745;
            color: white;
            padding: 12px 24px;
            border-radius: 25px;
            display: inline-block;
            font-weight: bold;
            margin-bottom: 30px;
            font-size: 14px;
          }
          .booking-details {
            background-color: #f8f9fa;
            border-left: 4px solid #800020;
            padding: 25px;
            margin: 30px 0;
            border-radius: 8px;
          }
          .booking-details h3 {
            margin: 0 0 20px 0;
            color: #800020;
            font-size: 18px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
          }
          .detail-row:last-child {
            border-bottom: none;
          }
          .detail-label {
            font-weight: bold;
            color: #495057;
            flex: 1;
          }
          .detail-value {
            flex: 2;
            text-align: right;
            color: #212529;
          }
          .booking-code-section {
            background: linear-gradient(135deg, #800020 0%, #a0002a 100%);
            color: white;
            padding: 25px;
            border-radius: 12px;
            text-align: center;
            margin: 30px 0;
          }
          .booking-code-section h3 {
            margin: 0 0 15px 0;
            font-size: 18px;
          }
          .booking-code {
            background-color: rgba(255, 255, 255, 0.2);
            border: 2px solid rgba(255, 255, 255, 0.3);
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: 24px;
            font-weight: bold;
            letter-spacing: 3px;
            margin: 15px 0;
          }
          .booking-code-note {
            font-size: 14px;
            opacity: 0.9;
            margin-top: 10px;
          }
          .cta-section {
            text-align: center;
            margin: 40px 0;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #800020 0%, #a0002a 100%);
            color: white;
            text-decoration: none;
            padding: 16px 32px;
            border-radius: 8px;
            font-weight: bold;
            font-size: 16px;
            transition: transform 0.2s ease;
            box-shadow: 0 4px 12px rgba(128, 0, 32, 0.3);
          }
          .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(128, 0, 32, 0.4);
          }
          .info-section {
            background-color: #e3f2fd;
            border: 1px solid #bbdefb;
            border-radius: 8px;
            padding: 20px;
            margin: 30px 0;
          }
          .info-section h4 {
            margin: 0 0 15px 0;
            color: #1976d2;
            font-size: 16px;
          }
          .info-section ul {
            margin: 0;
            padding-left: 20px;
          }
          .info-section li {
            margin-bottom: 8px;
            color: #424242;
          }
          .email-footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
          }
          .footer-content {
            color: #6c757d;
            font-size: 14px;
            line-height: 1.8;
          }
          .footer-content strong {
            color: #495057;
          }
          .social-links {
            margin: 20px 0 0 0;
          }
          .social-links a {
            color: #800020;
            text-decoration: none;
            margin: 0 10px;
            font-weight: bold;
          }
          @media (max-width: 600px) {
            .email-container {
              margin: 0;
              box-shadow: none;
            }
            .email-header, .email-body, .email-footer {
              padding: 30px 20px;
            }
            .detail-row {
              flex-direction: column;
              align-items: flex-start;
            }
            .detail-value {
              text-align: left;
              margin-top: 5px;
            }
            .booking-code {
              font-size: 20px;
              letter-spacing: 2px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h1>Queens Dock Barbershop</h1>
            <p class="subtitle">Professional Grooming Excellence</p>
          </div>
          
          <div class="email-body">
            <div class="confirmation-badge">
              ✓ Booking Confirmed
            </div>
            
            <h2>Hello ${name},</h2>
            <p>Great news! Your appointment has been successfully confirmed. We're looking forward to providing you with exceptional service at Queens Dock Barbershop.</p>
            
            <div class="booking-details">
              <h3>📅 Your Appointment Details</h3>
              <div class="detail-row">
                <span class="detail-label">Barber:</span>
                <span class="detail-value">${barberName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Service:</span>
                <span class="detail-value">${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span class="detail-value">${bookingDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">${bookingTime}</span>
              </div>
            </div>
            
            ${bookingCode ? `
            <div class="booking-code-section">
              <h3>🔐 Your Booking Reference Code</h3>
              <div class="booking-code">${bookingCode}</div>
              <p class="booking-code-note">
                Save this code! You'll need it to manage or modify your booking.
              </p>
            </div>
            ` : ''}
            
            <div class="cta-section">
              <a href="${managementLink}" class="cta-button">
                ${isGuest ? '📱 Manage Your Booking' : '👤 View Your Bookings'}
              </a>
            </div>
            
            <div class="info-section">
              <h4>📋 What to Expect</h4>
              <ul>
                <li>You'll receive a reminder 24 hours before your appointment</li>
                <li>Please arrive 5 minutes early for your appointment</li>
                <li>Bring a form of identification if this is your first visit</li>
                <li>Contact us if you need to reschedule or cancel</li>
              </ul>
            </div>
            
            <p>If you have any questions or need to make changes to your appointment, please don't hesitate to contact us or use the manage booking link above.</p>
            
            <p>Thank you for choosing Queens Dock Barbershop. We can't wait to see you!</p>
          </div>
          
          <div class="email-footer">
            <div class="footer-content">
              <strong>Queens Dock Barbershop</strong><br>
              52 Bank Street, Rossendale, BB4 8DY<br>
              📞 01706 831878<br>
              🌐 queensdockbarbershop.co.uk
              
              <div class="social-links">
                <a href="mailto:bookings@queensdockbarbershop.co.uk">Email Us</a>
                <a href="tel:01706831878">Call Us</a>
              </div>
              
              <p style="margin-top: 20px; font-size: 12px; color: #adb5bd;">
                © ${new Date().getFullYear()} Queens Dock Barbershop. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
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

    console.log(`Sending enhanced booking confirmation email to ${to} for booking ${bookingId}, isGuest: ${isGuest}`);

    // Create a nicely formatted date
    const dateObj = new Date(bookingDate);
    const formattedDate = dateObj.toLocaleDateString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Determine the management link based on user type
    const managementLink = isGuest 
      ? 'https://queensdockbarbershop.co.uk/verify-booking'
      : 'https://queensdockbarbershop.co.uk/login';

    console.log(`Management link for ${isGuest ? 'guest' : 'registered'} user: ${managementLink}`);

    let emailSubject = subject || 'Your Booking Confirmation - Queens Dock Barbershop';
    let emailHtml = '';

    // If template string is provided in the request, use template system
    if (emailTemplate) {
      const templateVariables = {
        name,
        bookingCode: bookingCode || '',
        bookingDate: formattedDate,
        bookingTime,
        barberName,
        serviceName,
        managementLink
      };
      
      // Connect to Supabase with service role key from environment
      const supabaseClient = await createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      );

      const defaultTemplate = await getDefaultEmailTemplate(supabaseClient);
      
      if (defaultTemplate) {
        emailSubject = replaceTemplateVariables(defaultTemplate.subject, templateVariables);
        const templateContent = replaceTemplateVariables(defaultTemplate.content, templateVariables);
        
        // Wrap the content in our standard email template
        emailHtml = `
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
                  background-color: #800020;
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
              </style>
            </head>
            <body>
              <div class="email-container">
                <div class="email-header">
                  <h1>Queens Dock Barbershop</h1>
                </div>
                <div class="email-body">
                  <h2>${emailSubject}</h2>
                  ${templateContent}
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
      } else {
        // Fallback to enhanced template
        emailHtml = createBookingConfirmationEmail(
          name,
          bookingCode || '',
          formattedDate,
          bookingTime,
          barberName,
          serviceName,
          isGuest,
          managementLink
        );
      }
    } else {
      // Use the new enhanced template by default
      emailHtml = createBookingConfirmationEmail(
        name,
        bookingCode || '',
        formattedDate,
        bookingTime,
        barberName,
        serviceName,
        isGuest,
        managementLink
      );
    }
    
    // Send the email using Resend with verified domain
    const { data, error } = await resend.emails.send({
      from: 'Queens Dock Barbershop <bookings@queensdockbarbershop.co.uk>',
      to: [to],
      subject: emailSubject,
      html: emailHtml
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    console.log('Enhanced email sent successfully:', data);

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Enhanced booking confirmation email sent",
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
