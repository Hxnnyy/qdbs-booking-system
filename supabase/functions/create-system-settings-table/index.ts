
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

interface SystemSettingsRequest {
  action: 'get_settings' | 'save_settings';
  setting_type: string;
  settings?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const { action, setting_type, settings }: SystemSettingsRequest = await req.json();
    console.log(`Action: ${action}, Setting type: ${setting_type}`);
    
    if (action === 'get_settings') {
      console.log(`Fetching settings for type: ${setting_type}`);
      
      const { data, error } = await supabase
        .from('system_settings')
        .select('settings')
        .eq('setting_type', setting_type)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('Error fetching settings:', error);
        throw error;
      }
      
      // Return default settings if none exist
      const defaultSettings = getDefaultSettings(setting_type);
      const settingsData = data?.settings || defaultSettings;
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          settings: settingsData 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (action === 'save_settings') {
      console.log(`Saving settings for type: ${setting_type}`, settings);
      
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          setting_type,
          settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'setting_type'
        });
      
      if (error) {
        console.error('Error saving settings:', error);
        throw error;
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Settings saved successfully' 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    throw new Error('Invalid action');
    
  } catch (error) {
    console.error("Error in create-system-settings-table function:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Error processing system settings"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
};

function getDefaultSettings(setting_type: string) {
  switch (setting_type) {
    case 'reminder_settings':
      return {
        days_before: 1,
        reminder_time: '10:00',
        send_reminders: true
      };
    default:
      return {};
  }
}

serve(handler);
