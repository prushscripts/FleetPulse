-- Multi-tenant: companies and company_id on vehicles/drivers
-- Run this in Supabase SQL Editor. Then backfill existing data to your first company (see comments at end).

-- Companies table (each customer gets one; auth_key is the "company authentication key" you email them)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  auth_key TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_companies_auth_key ON companies(auth_key);

-- Add company_id to vehicles and drivers (nullable for migration; backfill after)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_vehicles_company_id ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_company_id ON drivers(company_id);

-- Seed Wheelz Up as first company (auth_key = company authentication key for your team)
INSERT INTO companies (id, name, auth_key)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Wheelz Up',
  'WheelzUpAPD2026'
)
ON CONFLICT (auth_key) DO NOTHING;

-- RLS: allow authenticated users to read companies (to look up by auth_key during activation)
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read companies"
  ON companies FOR SELECT TO authenticated USING (true);

-- Optional: backfill existing vehicles and drivers to Wheelz Up so current data is assigned
-- Uncomment and run after the INSERT above:
-- UPDATE vehicles SET company_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE company_id IS NULL;
-- UPDATE drivers SET company_id = 'a0000000-0000-0000-0000-000000000001'::uuid WHERE company_id IS NULL;
