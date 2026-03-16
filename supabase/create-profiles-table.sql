-- Create profiles table if it doesn't exist (required before phase2-user-role.sql and RLS).
-- Run this FIRST in Supabase SQL editor, then run the phase2-*.sql scripts.

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'owner',
  nickname TEXT DEFAULT '',
  company_id UUID REFERENCES public.companies(id)
);

-- Optional: create/update profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'role', 'owner'))
  ON CONFLICT (id) DO UPDATE SET
    role = COALESCE(EXCLUDED.role, profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

-- Backfill existing users (run once if you already have auth.users with no profiles)
-- INSERT INTO public.profiles (id, role)
-- SELECT id, COALESCE(raw_user_meta_data->>'role', 'owner') FROM auth.users
-- ON CONFLICT (id) DO NOTHING;
