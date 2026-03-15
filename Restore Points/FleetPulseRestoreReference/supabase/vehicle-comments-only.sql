-- Vehicle Comments Table Only
-- Run this SQL in Supabase SQL Editor to create the vehicle_comments table
-- This file avoids trigger conflicts by only creating what's needed

-- Create vehicle_comments table
CREATE TABLE IF NOT EXISTS vehicle_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  author_email VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vehicle_comments_vehicle_id ON vehicle_comments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_comments_created_at ON vehicle_comments(created_at DESC);

-- Enable RLS
ALTER TABLE vehicle_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can read vehicle_comments"
  ON vehicle_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert vehicle_comments"
  ON vehicle_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update vehicle_comments"
  ON vehicle_comments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete vehicle_comments"
  ON vehicle_comments FOR DELETE
  TO authenticated
  USING (true);
