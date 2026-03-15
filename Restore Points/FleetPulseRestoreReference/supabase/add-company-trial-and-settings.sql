-- Company trial and optional settings (run in Supabase SQL Editor)
-- Trial: 7-day company auth key; we can set trial_ends_at when creating a trial company.

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT NULL;

COMMENT ON COLUMN companies.trial_ends_at IS 'When set, this company is a trial and access may be limited after this time.';
COMMENT ON COLUMN companies.display_name IS 'Short display name for navbar (e.g. Prush Logistics instead of full legal name).';
