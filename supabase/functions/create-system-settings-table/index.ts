
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Creating system_settings table if it does not exist');
    
    // Check if the table exists
    const { data: tableExists, error: checkError } = await supabase.rpc('check_table_exists', {
      table_name: 'system_settings'
    });
    
    if (checkError) {
      console.error('Error checking if table exists:', checkError);
      throw checkError;
    }
    
    if (tableExists) {
      console.log('Table system_settings already exists');
      return new Response(
        JSON.stringify({ success: true, message: 'Table already exists' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create the table using raw SQL
    const { error: createError } = await supabase.rpc('create_system_settings_table');
    
    if (createError) {
      console.error('Error creating table:', createError);
      throw createError;
    }
    
    console.log('Successfully created system_settings table');
    
    return new Response(
      JSON.stringify({ success: true, message: 'Table created successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in create-system-settings-table function:', error);
    
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'An unknown error occurred' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
