-- Create driver_writeups table
-- Safe to run multiple times (uses IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS driver_writeups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  tier VARCHAR(10) NOT NULL CHECK (tier IN ('tier1', 'tier2', 'tier3')),
  reason TEXT NOT NULL,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_driver_writeups_driver_id ON driver_writeups(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_writeups_tier ON driver_writeups(tier);
CREATE INDEX IF NOT EXISTS idx_driver_writeups_created_at ON driver_writeups(created_at DESC);

-- Enable RLS
ALTER TABLE driver_writeups ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Authenticated users can manage writeups
CREATE POLICY "Authenticated users can view driver_writeups"
  ON driver_writeups FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert driver_writeups"
  ON driver_writeups FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update driver_writeups"
  ON driver_writeups FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete driver_writeups"
  ON driver_writeups FOR DELETE
  TO authenticated
  USING (true);
