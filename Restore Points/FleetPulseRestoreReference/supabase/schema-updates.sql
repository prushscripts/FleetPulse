-- FleetPulse Schema Updates
-- Run this SQL in your Supabase SQL Editor to add new features

-- Add status column to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'out_of_service', 'in_shop'));

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  license_number VARCHAR(50),
  license_expiration DATE,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  hire_date DATE,
  signed_citation_policy BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS hire_date DATE;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS signed_citation_policy BOOLEAN DEFAULT false;

-- Add driver_id to vehicles table
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL;

-- Create inspections table
CREATE TABLE IF NOT EXISTS inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  inspection_type VARCHAR(50) DEFAULT 'pre_trip' CHECK (inspection_type IN ('pre_trip', 'post_trip', 'scheduled', 'incident')),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed')),
  
  -- Inspection checklist items
  brakes_ok BOOLEAN,
  brakes_notes TEXT,
  tires_ok BOOLEAN,
  tires_notes TEXT,
  lights_ok BOOLEAN,
  lights_notes TEXT,
  mirrors_ok BOOLEAN,
  mirrors_notes TEXT,
  fluids_ok BOOLEAN,
  fluids_notes TEXT,
  body_ok BOOLEAN,
  body_notes TEXT,
  engine_ok BOOLEAN,
  engine_notes TEXT,
  transmission_ok BOOLEAN,
  transmission_notes TEXT,
  other_issues TEXT,
  
  -- Photo URLs (stored in Supabase Storage)
  photo_front_url TEXT,
  photo_back_url TEXT,
  photo_left_url TEXT,
  photo_right_url TEXT,
  photo_other_urls TEXT[], -- Array of additional photo URLs
  
  mileage INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicles_status ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id ON vehicles(driver_id);
CREATE INDEX IF NOT EXISTS idx_drivers_active ON drivers(active);
CREATE INDEX IF NOT EXISTS idx_inspections_vehicle_id ON inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_inspections_driver_id ON inspections(driver_id);
CREATE INDEX IF NOT EXISTS idx_inspections_date ON inspections(inspection_date DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);

-- Create trigger for drivers updated_at
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inspections_updated_at
  BEFORE UPDATE ON inspections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on new tables
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for drivers
CREATE POLICY "Authenticated users can read drivers"
  ON drivers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert drivers"
  ON drivers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update drivers"
  ON drivers FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete drivers"
  ON drivers FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for inspections
CREATE POLICY "Authenticated users can read inspections"
  ON inspections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inspections"
  ON inspections FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inspections"
  ON inspections FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete inspections"
  ON inspections FOR DELETE
  TO authenticated
  USING (true);

-- Vehicle comments thread
CREATE TABLE IF NOT EXISTS vehicle_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  author_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_vehicle_comments_vehicle_id ON vehicle_comments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_comments_created_at ON vehicle_comments(created_at DESC);

ALTER TABLE vehicle_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read vehicle_comments"
  ON vehicle_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicle_comments"
  ON vehicle_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicle_comments"
  ON vehicle_comments FOR DELETE
  TO authenticated
  USING (true);
