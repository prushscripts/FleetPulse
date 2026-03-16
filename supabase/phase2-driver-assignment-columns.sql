-- Phase 2: driver-vehicle assignment system columns
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_ny_driver BOOLEAN DEFAULT false;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS is_dmv_driver BOOLEAN DEFAULT false;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID REFERENCES vehicles(id);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS assigned_driver_id UUID REFERENCES drivers(id);

