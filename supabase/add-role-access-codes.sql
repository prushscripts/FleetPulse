ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS manager_access_code TEXT,
ADD COLUMN IF NOT EXISTS driver_access_code TEXT;

-- Set the codes for WheelzUp company
UPDATE companies 
SET 
  manager_access_code = 'WheelzAPD2026!',
  driver_access_code = 'Wheelzupauth2026'
WHERE auth_key = 'WheelzUpAPD2026'
   OR name ILIKE '%wheelz%';
