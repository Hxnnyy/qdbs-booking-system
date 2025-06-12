
-- Create the system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_type TEXT UNIQUE NOT NULL,
  settings JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to read settings
CREATE POLICY "Allow authenticated users to read system settings" 
  ON public.system_settings 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create policy for admins to manage settings
CREATE POLICY "Allow admins to manage system settings" 
  ON public.system_settings 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND (is_admin = true OR is_super_admin = true)
    )
  );
