-- Add user_id linkage to drivers so managers can see account status
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS user_id uuid;

-- Optional: backfill user_id from auth.users/profiles by email+company_id
-- (safe if no match; leaves null)
UPDATE drivers d
SET user_id = u.id
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE d.user_id IS NULL
  AND d.email = u.email
  AND d.company_id = p.company_id;
