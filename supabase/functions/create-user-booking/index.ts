
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Constants and types
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingData {
  barber_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  status: string;
  notes?: string | null;
  user_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    // Create Supabase client with service role key (has admin privileges)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Parse request body
    const { booking } = await req.json();
    
    if (!booking || !booking.barber_id || !booking.service_id || !booking.booking_date || 
        !booking.booking_time || !booking.user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required booking information" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log("Creating booking with service role:", booking);
    
    // Create the booking with service role privileges (bypassing RLS)
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        barber_id: booking.barber_id,
        service_id: booking.service_id,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        status: booking.status || "confirmed",
        notes: booking.notes || null,
        user_id: booking.user_id,
        guest_booking: false
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating booking:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Get user email from profiles table to send notification
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", booking.user_id)
      .single();
    
    // Try to send confirmation email but don't fail if it doesn't work
    try {
      if (profile && profile.email) {
        // Get barber and service names
        const { data: barberData } = await supabase
          .from("barbers")
          .select("name")
          .eq("id", booking.barber_id)
          .single();
          
        const { data: serviceData } = await supabase
          .from("services")
          .select("name")
          .eq("id", booking.service_id)
          .single();
        
        // Send confirmation email
        await supabase.functions.invoke("send-booking-email", {
          body: {
            to: profile.email,
            name: `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Customer",
            bookingId: data.id,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            barberName: barberData?.name || "Barber",
            serviceName: serviceData?.name || "Service",
            isGuest: false
          }
        });
        
        console.log("Confirmation email sent");
      }
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Continue without failing
    }
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (err) {
    console.error("Error processing request:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
