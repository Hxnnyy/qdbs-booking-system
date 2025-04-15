
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderSettings {
  days_before: number;
  reminder_time: string;
  send_reminders: boolean;
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const settings: ReminderSettings = await req.json();
    console.log('Received settings:', settings);
    
    // If reminders are disabled, drop any existing cron jobs
    if (!settings.send_reminders) {
      console.log('Reminders are disabled, removing cron job if it exists');
      
      await supabase.rpc('drop_cron_job', {
        job_name: 'booking_reminder_job'
      });
      
      return new Response(
        JSON.stringify({ success: true, message: "Reminder cron job disabled" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Extract the time components from reminder_time (HH:MM format)
    const [hour, minute] = settings.reminder_time.split(':').map(Number);
    
    // Create cron expression for the specified time
    const cronExpression = `${minute} ${hour} * * *`;
    
    console.log(`Setting up cron job to run at: ${settings.reminder_time} (${cronExpression})`);
    
    // First check if the job already exists
    const { data: existingJobs } = await supabase.rpc('list_cron_jobs');
    const jobExists = existingJobs?.some(job => job.jobname === 'booking_reminder_job');
    
    if (jobExists) {
      console.log('Updating existing cron job');
      // Update the existing job
      await supabase.rpc('update_cron_job', {
        job_name: 'booking_reminder_job',
        schedule: cronExpression
      });
    } else {
      console.log('Creating new cron job');
      // Create a new cron job
      await supabase.rpc('create_booking_reminder_job', {
        schedule: cronExpression,
        days_before: settings.days_before
      });
    }
    
    console.log('Cron job updated successfully');
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Reminder schedule updated successfully",
        cronExpression
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in update-reminder-schedule function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Error updating reminder schedule"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
};

serve(handler);
