-- Run this ONCE in Supabase SQL editor if announcements table is missing company_id.
-- Then run phase2-rls-inspections-announcements.sql (or just the announcements policies).

ALTER TABLE announcements
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
