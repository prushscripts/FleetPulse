-- Phase 2 inspection + announcements foundation

CREATE TABLE IF NOT EXISTS inspection_templates (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id UUID REFERENCES companies(id),
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  submitted_by_user_id UUID,
  template_id TEXT REFERENCES inspection_templates(id),
  type TEXT NOT NULL DEFAULT 'pre_trip',
  status TEXT NOT NULL DEFAULT 'pending',
  odometer INTEGER,
  results JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  signature TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  company_id UUID NOT NULL REFERENCES companies(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  created_by UUID,
  target TEXT DEFAULT 'all',
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default templates for existing companies if missing
INSERT INTO inspection_templates (company_id, name, type, is_default, items)
SELECT c.id, 'Standard Pre-Trip', 'pre_trip', true,
  '[
    {"id":"lights_signals","label":"Lights & signals","category":"Exterior","required":true,"allowPhoto":true,"allowNote":true},
    {"id":"tires_wheels","label":"Tires & wheels","category":"Exterior","required":true,"allowPhoto":true,"allowNote":true},
    {"id":"body_damage","label":"Body damage check","category":"Exterior","required":true,"allowPhoto":true,"allowNote":true},
    {"id":"windows_mirrors","label":"Windows & mirrors","category":"Exterior","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"engine_oil","label":"Engine oil level","category":"Under Hood","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"coolant","label":"Coolant level","category":"Under Hood","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"brake_fluid","label":"Brake fluid","category":"Under Hood","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"belts_hoses","label":"Belts & hoses","category":"Under Hood","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"brakes_feel","label":"Brakes feel","category":"Interior","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"steering","label":"Steering","category":"Interior","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"horn","label":"Horn","category":"Interior","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"seatbelt","label":"Seatbelt","category":"Interior","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"dash_lights","label":"Dashboard warning lights","category":"Interior","required":true,"allowPhoto":true,"allowNote":true},
    {"id":"extinguisher","label":"Fire extinguisher","category":"Safety","required":true,"allowPhoto":true,"allowNote":true},
    {"id":"first_aid","label":"First aid kit","category":"Safety","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"triangles","label":"Emergency triangles","category":"Safety","required":true,"allowPhoto":false,"allowNote":true}
  ]'::jsonb
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM inspection_templates t WHERE t.company_id = c.id AND t.type = 'pre_trip'
);

INSERT INTO inspection_templates (company_id, name, type, is_default, items)
SELECT c.id, 'Standard Post-Trip', 'post_trip', false,
  '[
    {"id":"body_damage_new","label":"Body damage (new)","category":"Exterior","required":true,"allowPhoto":true,"allowNote":true},
    {"id":"tires_condition","label":"Tires condition","category":"Exterior","required":true,"allowPhoto":true,"allowNote":true},
    {"id":"lights_working","label":"Lights working","category":"Exterior","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"unusual_sounds","label":"Any unusual sounds","category":"Mechanical","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"post_brakes","label":"Brakes feel","category":"Mechanical","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"post_steering","label":"Steering","category":"Mechanical","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"fuel_level","label":"Fuel level","category":"Fuel","required":true,"allowPhoto":false,"allowNote":true},
    {"id":"leaks","label":"Any leaks noticed","category":"Fuel","required":true,"allowPhoto":true,"allowNote":true},
    {"id":"driver_notes","label":"Driver notes on vehicle condition","category":"Notes","required":false,"allowPhoto":true,"allowNote":true}
  ]'::jsonb
FROM companies c
WHERE NOT EXISTS (
  SELECT 1 FROM inspection_templates t WHERE t.company_id = c.id AND t.type = 'post_trip'
);

