-- Ensure announcements has target_territory and expires_at for Admin Announcements tab.
-- Run once in Supabase SQL editor if your announcements table was created without these columns.

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS target_territory TEXT;

ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
