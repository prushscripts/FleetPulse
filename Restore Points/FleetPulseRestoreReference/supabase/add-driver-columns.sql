-- Add missing columns to drivers table
-- Safe to run multiple times (uses IF NOT EXISTS)

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS signed_citation_policy BOOLEAN DEFAULT false;

-- Verify columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'drivers'
  AND column_name IN ('hire_date', 'signed_citation_policy')
ORDER BY column_name;
