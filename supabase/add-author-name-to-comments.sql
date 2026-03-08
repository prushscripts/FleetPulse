-- Add author_name column to vehicle_comments table
-- Safe to run multiple times (uses IF NOT EXISTS)

ALTER TABLE vehicle_comments ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);

-- Update existing comments to use capitalized email username as author_name if null
UPDATE vehicle_comments
SET author_name = INITCAP(SPLIT_PART(author_email, '@', 1))
WHERE author_name IS NULL AND author_email IS NOT NULL;
