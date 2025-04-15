
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
    // Parse request body
    const requestData = await req.json();
    const { action = 'create_table', setting_type = null, settings = null } = requestData;
    
    console.log(`Action: ${action}, Setting type: ${setting_type}`);
    
    // Different actions based on the request
    if (action === 'create_table') {
      return await createSystemSettingsTable();
    } else if (action === 'get_settings') {
      return await getSettings(setting_type);
    } else if (action === 'save_settings') {
      return await saveSettings(setting_type, settings);
    } else {
      throw new Error('Invalid action specified');
    }
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

async function createSystemSettingsTable() {
  console.log('Creating system_settings table if it does not exist');
  
  // Check if the table exists using raw query
  const { data: tableExists, error: checkError } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .eq('tablename', 'system_settings')
    .maybeSingle();
  
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
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS public.system_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      setting_type TEXT NOT NULL,
      settings JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    );
    
    ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY "authenticated_users_can_view_settings" 
      ON public.system_settings FOR SELECT
      USING (auth.role() = 'authenticated');
    
    CREATE POLICY "admins_can_modify_settings"
      ON public.system_settings FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
        )
      );
  `;
  
  const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
  
  if (createError) {
    console.error('Error creating table:', createError);
    throw createError;
  }
  
  console.log('Successfully created system_settings table');
  
  return new Response(
    JSON.stringify({ success: true, message: 'Table created successfully' }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getSettings(settingType: string) {
  if (!settingType) {
    throw new Error('Setting type is required');
  }
  
  console.log(`Fetching settings for type: ${settingType}`);
  
  // Check if the table exists
  const { data: tableExists, error: checkError } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .eq('tablename', 'system_settings')
    .maybeSingle();
  
  if (checkError) {
    console.error('Error checking if table exists:', checkError);
    throw checkError;
  }
  
  if (!tableExists) {
    console.log('Table system_settings does not exist yet');
    return new Response(
      JSON.stringify({ success: true, message: 'Settings table does not exist yet', settings: null }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Fetch the settings
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('setting_type', settingType)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
  
  console.log('Settings fetched successfully:', data);
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: data ? 'Settings found' : 'No settings found',
      settings: data ? data.settings : null,
      settingId: data?.id || null
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function saveSettings(settingType: string, settings: any) {
  if (!settingType) {
    throw new Error('Setting type is required');
  }
  
  if (!settings) {
    throw new Error('Settings data is required');
  }
  
  console.log(`Saving settings for type: ${settingType}`, settings);
  
  // Check if the table exists
  const { data: tableExists, error: checkError } = await supabase
    .from('pg_tables')
    .select('tablename')
    .eq('schemaname', 'public')
    .eq('tablename', 'system_settings')
    .maybeSingle();
  
  if (checkError) {
    console.error('Error checking if table exists:', checkError);
    throw checkError;
  }
  
  if (!tableExists) {
    // Create the table first
    await createSystemSettingsTable();
  }
  
  // Check if settings already exist
  const { data: existingSettings, error: fetchError } = await supabase
    .from('system_settings')
    .select('id')
    .eq('setting_type', settingType)
    .maybeSingle();
  
  if (fetchError) {
    console.error('Error checking existing settings:', fetchError);
    throw fetchError;
  }
  
  let result;
  
  if (existingSettings) {
    // Update existing settings
    console.log(`Updating existing settings with ID: ${existingSettings.id}`);
    result = await supabase
      .from('system_settings')
      .update({ 
        settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingSettings.id);
  } else {
    // Insert new settings
    console.log('Inserting new settings');
    result = await supabase
      .from('system_settings')
      .insert({ 
        setting_type: settingType,
        settings
      });
  }
  
  if (result.error) {
    console.error('Error saving settings:', result.error);
    throw result.error;
  }
  
  console.log('Settings saved successfully');
  
  return new Response(
    JSON.stringify({ 
      success: true, 
      message: existingSettings ? 'Settings updated' : 'Settings created',
      settingId: existingSettings?.id || null
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
