
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const fromEmail = "Queens Dock Barbershop <bookings@queensdockbarbershop.co.uk>";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipients, subject, content } = await req.json();

    // Validate inputs
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("No valid recipients provided");
    }

    if (!subject) {
      throw new Error("Email subject is required");
    }

    if (!content) {
      throw new Error("Email content is required");
    }

    console.log(`Sending email to ${recipients.length} recipients`);

    // Send email to all recipients
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipients,
      subject: subject,
      html: content,
    });

    if (error) {
      console.error("Error sending email:", error);
      throw error;
    }

    console.log("Email sent successfully:", data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Email sent to ${recipients.length} recipients`,
        data 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in send-clients-email function:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );
  }
});
