-- Add optional nickname column to profiles for display names
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS nickname TEXT DEFAULT '';

