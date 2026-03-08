-- Voyager US Bank Fleet Gas Card Integration
-- This table stores the mapping between Voyager gas card numbers and FleetPulse vehicles
-- When a driver uses a gas card at the pump and enters mileage, it will update the corresponding vehicle

CREATE TABLE IF NOT EXISTS voyager_card_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_number VARCHAR(50) NOT NULL UNIQUE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  vehicle_code VARCHAR(50) NOT NULL, -- Denormalized for quick lookup
  active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES auth.users(id)
);

-- Voyager API Configuration (stored securely, admin-only access)
CREATE TABLE IF NOT EXISTS voyager_api_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  api_key TEXT NOT NULL, -- Encrypted/stored securely
  api_endpoint VARCHAR(255),
  account_id VARCHAR(100),
  enabled BOOLEAN DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_by UUID REFERENCES auth.users(id)
);

-- Mileage update log (track when mileage is updated from Voyager)
CREATE TABLE IF NOT EXISTS voyager_mileage_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  card_number VARCHAR(50) NOT NULL,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  mileage INTEGER NOT NULL,
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL,
  transaction_id VARCHAR(100), -- Voyager transaction ID
  raw_data JSONB, -- Store full API response for debugging
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voyager_card_mappings_card_number ON voyager_card_mappings(card_number);
CREATE INDEX IF NOT EXISTS idx_voyager_card_mappings_vehicle_id ON voyager_card_mappings(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_voyager_card_mappings_active ON voyager_card_mappings(active);
CREATE INDEX IF NOT EXISTS idx_voyager_mileage_updates_card_number ON voyager_mileage_updates(card_number);
CREATE INDEX IF NOT EXISTS idx_voyager_mileage_updates_vehicle_id ON voyager_mileage_updates(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_voyager_mileage_updates_transaction_date ON voyager_mileage_updates(transaction_date DESC);

-- Trigger for updated_at
CREATE TRIGGER update_voyager_card_mappings_updated_at
  BEFORE UPDATE ON voyager_card_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_voyager_api_config_updated_at
  BEFORE UPDATE ON voyager_api_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE voyager_card_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyager_api_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE voyager_mileage_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voyager_card_mappings
-- Only authenticated users can read, but only admins can modify
CREATE POLICY "Authenticated users can read voyager_card_mappings"
  ON voyager_card_mappings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert voyager_card_mappings"
  ON voyager_card_mappings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

CREATE POLICY "Admins can update voyager_card_mappings"
  ON voyager_card_mappings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

CREATE POLICY "Admins can delete voyager_card_mappings"
  ON voyager_card_mappings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

-- RLS Policies for voyager_api_config (admin-only)
CREATE POLICY "Admins can read voyager_api_config"
  ON voyager_api_config FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

CREATE POLICY "Admins can insert voyager_api_config"
  ON voyager_api_config FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

CREATE POLICY "Admins can update voyager_api_config"
  ON voyager_api_config FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'is_admin')::boolean = true
    )
  );

-- RLS Policies for voyager_mileage_updates (read-only for most users, admins can see all)
CREATE POLICY "Authenticated users can read voyager_mileage_updates"
  ON voyager_mileage_updates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can insert voyager_mileage_updates"
  ON voyager_mileage_updates FOR INSERT
  TO authenticated
  WITH CHECK (true); -- API/webhook can insert

-- Note: To mark a user as admin, update their user_metadata:
-- UPDATE auth.users SET raw_user_meta_data = jsonb_set(
--   COALESCE(raw_user_meta_data, '{}'::jsonb),
--   '{is_admin}',
--   'true'::jsonb
-- ) WHERE id = 'user-uuid-here';
