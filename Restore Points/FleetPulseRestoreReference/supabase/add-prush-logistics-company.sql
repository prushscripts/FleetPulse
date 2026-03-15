-- Add Prush Logistics Group LLC as a second company in FleetPulse.
-- Run this in Supabase → SQL Editor → New query, then Run.
-- Auth key 'prushlogisticsroadmap' is what users enter in Settings → My Companies → Add company.

INSERT INTO companies (id, name, auth_key)
VALUES (
  uuid_generate_v4(),
  'Prush Logistics Group LLC',
  'prushlogisticsroadmap'
)
ON CONFLICT (auth_key) DO NOTHING;

-- =============================================================================
-- HOW TO ADD A NEW COMPANY IN THE FUTURE
-- =============================================================================
-- 1. In Supabase Dashboard: go to SQL Editor → New query.
-- 2. Run a statement like this (change name and auth_key):
--
--    INSERT INTO companies (id, name, auth_key)
--    VALUES (
--      uuid_generate_v4(),
--      'Your Company Name',
--      'your-auth-key-slug'   -- e.g. mycompany2026 (no spaces; users type this in Settings)
--    )
--    ON CONFLICT (auth_key) DO NOTHING;
--
-- 3. Share the auth_key with your team. They go to FleetPulse → Settings → My Companies
--    → "Add another company" and enter that key to get access to the new company.
-- =============================================================================
