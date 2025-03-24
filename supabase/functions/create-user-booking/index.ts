
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";

// Constants and types
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
    console.log("Edge function invoked with method:", req.method);
    
    // Get environment variables
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    console.log("Supabase URL defined:", !!supabaseUrl);
    console.log("Supabase Service Role Key defined:", !!supabaseServiceKey);
    
    // Validate environment variables
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Create Supabase client with service role key (has admin privileges)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Supabase client created");
    
    // Parse request body
    let requestData;
    try {
      requestData = await req.json();
      console.log("Request data:", JSON.stringify(requestData));
    } catch (parseError) {
      console.error("Error parsing request JSON:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    const booking = requestData.booking;
    
    // Validate booking data
    if (!booking) {
      console.error("No booking data provided");
      return new Response(
        JSON.stringify({ error: "No booking data provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!booking.barber_id || !booking.service_id || !booking.booking_date || 
        !booking.booking_time || !booking.user_id) {
      console.error("Missing required booking fields:", JSON.stringify(booking));
      return new Response(
        JSON.stringify({ error: "Missing required booking information" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Verify the user exists using our new secure function
    console.log("Verifying user_id is valid:", booking.user_id);
    const { data: userIsValid, error: userCheckError } = await supabase.rpc(
      'is_valid_user_id',
      { user_id: booking.user_id }
    );
    
    if (userCheckError) {
      console.error("Error checking user validity:", userCheckError.message);
      return new Response(
        JSON.stringify({ error: "Error validating user", details: userCheckError.message }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    if (!userIsValid) {
      console.error("Invalid user_id provided:", booking.user_id);
      return new Response(
        JSON.stringify({ error: "Invalid user ID provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    // Get profile information before creating the booking
    console.log("Fetching user profile for booking notes");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name, phone")
      .eq("id", booking.user_id)
      .single();
    
    // Create formatted notes with user info if profile exists and no notes provided
    let bookingNotes = booking.notes || "";
    if (profile) {
      const userName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      
      // If there are existing notes, append the user info
      if (bookingNotes) {
        bookingNotes += "\n\n";
      }
      
      // Add user info to the notes
      bookingNotes += `User: ${userName}\nPhone: ${profile.phone || 'Not provided'}\nEmail: ${profile.email || 'Not provided'}`;
    }
    
    console.log("Creating booking with service role:", JSON.stringify(booking));
    
    // Create the booking with service role privileges (bypassing RLS)
    const { data, error } = await supabase
      .from("bookings")
      .insert({
        barber_id: booking.barber_id,
        service_id: booking.service_id,
        booking_date: booking.booking_date,
        booking_time: booking.booking_time,
        status: booking.status || "confirmed",
        notes: bookingNotes,
        user_id: booking.user_id,
        guest_booking: false
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating booking:", error.message);
      
      if (error.details) {
        console.error("Error details:", error.details);
      }
      
      if (error.hint) {
        console.error("Error hint:", error.hint);
      }
      
      return new Response(
        JSON.stringify({ error: error.message, details: error.details }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log("Booking created successfully:", JSON.stringify(data));
    
    // Get profile information from profiles table
    const { data: profileData, error: profileDataError } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", booking.user_id)
      .single();
    
    if (profileDataError) {
      console.error("Error fetching user profile:", profileDataError.message);
      // Continue despite profile error - we'll still return the booking
    }
    
    // Try to send confirmation email but don't fail if it doesn't work
    try {
      if (profileData && profileData.email) {
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
            to: profileData.email,
            name: `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || "Customer",
            bookingId: data.id,
            bookingDate: booking.booking_date,
            bookingTime: booking.booking_time,
            barberName: barberData?.name || "Barber",
            serviceName: serviceData?.name || "Service",
            isGuest: false
          }
        });
        
        console.log("Confirmation email sent to:", profileData.email);
      } else {
        console.log("No profile email found, skipping confirmation email");
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
    console.error("Unexpected error processing request:", err.message);
    console.error("Error stack:", err.stack);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: err.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
