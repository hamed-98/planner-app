-- SQL Setup for Super Admin Features

-- 1. Add Role, Plan, and Email to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Sync existing user emails from auth.users to public.profiles
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- Make handle_new_user trigger function robust
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), 
    new.email
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is superadmin (prevents infinite recursion in policies)
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'superadmin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add policy to allow superadmin to select all profiles
DROP POLICY IF EXISTS "Allow superadmin to select profiles" ON public.profiles;
CREATE POLICY "Allow superadmin to select profiles" 
ON public.profiles FOR SELECT 
USING (public.is_superadmin());

-- Add policy to allow superadmin to update profiles
DROP POLICY IF EXISTS "Allow superadmin to update profiles" ON public.profiles;
CREATE POLICY "Allow superadmin to update profiles" 
ON public.profiles FOR UPDATE 
USING (public.is_superadmin());

-- 2. Create Global Settings table
CREATE TABLE IF NOT EXISTS public.global_settings (
    id text PRIMARY KEY,
    value jsonb NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- *** اضافه کردن DROP POLICY ***
DROP POLICY IF EXISTS "Allow public read for specific settings" ON public.global_settings;
CREATE POLICY "Allow public read for specific settings" 
ON public.global_settings FOR SELECT 
USING (id IN ('landing_page', 'announcements'));

DROP POLICY IF EXISTS "Allow superadmin full access to global_settings" ON public.global_settings;
CREATE POLICY "Allow superadmin full access to global_settings" 
ON public.global_settings FOR ALL 
USING (public.is_superadmin());

-- 3. Create Admin Logs table
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action text NOT NULL,
    user_id uuid REFERENCES auth.users(id),
    details jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- *** اضافه کردن DROP POLICY ***
DROP POLICY IF EXISTS "Allow superadmin full access to admin_logs" ON public.admin_logs;
CREATE POLICY "Allow superadmin full access to admin_logs" 
ON public.admin_logs FOR ALL 
USING (public.is_superadmin());

-- 4. Initial Global Settings
INSERT INTO public.global_settings (id, value) VALUES
('api_keys', '{"gemini": "", "supabase_service_role": ""}'::jsonb),
('landing_page', '{"hero_bg": "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=2074&auto=format&fit=crop", "logo": ""}'::jsonb),
('feature_flags', '{"enable_gemini": true, "enable_sharing": false}'::jsonb),
('announcements', '{"show": false, "text": "", "type": "info"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 5. Create storage bucket for public assets
INSERT INTO storage.buckets (id, name, public) VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'public');

-- Policy to allow authenticated users to upload
DROP POLICY IF EXISTS "Auth Upload Access" ON storage.objects;
CREATE POLICY "Auth Upload Access" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'public' AND auth.role() = 'authenticated');

-- Policy to allow superadmin to update/delete
DROP POLICY IF EXISTS "Superadmin Update Access" ON storage.objects;
CREATE POLICY "Superadmin Update Access" ON storage.objects FOR UPDATE USING (bucket_id = 'public' AND public.is_superadmin());

DROP POLICY IF EXISTS "Superadmin Delete Access" ON storage.objects;
CREATE POLICY "Superadmin Delete Access" ON storage.objects FOR DELETE USING (bucket_id = 'public' AND public.is_superadmin());

-- Note: You need to set at least one user as superadmin manually in Supabase SQL editor:
-- UPDATE public.profiles SET role = 'superadmin' WHERE email = 'your-email@example.com';
