-- Add location column to drivers table
-- Safe to run multiple times (uses IF NOT EXISTS)

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS location VARCHAR(20);

-- Verify column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'drivers'
  AND column_name = 'location';
