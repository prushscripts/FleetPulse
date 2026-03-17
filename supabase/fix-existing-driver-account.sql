-- Ensure test driver has a drivers table record with linked user_id

INSERT INTO drivers (
  user_id,
  first_name,
  last_name,
  email,
  company_id,
  location,
  active,
  signed_citation_policy,
  is_ny_driver,
  is_dmv_driver
)
SELECT 
  p.id as user_id,
  COALESCE(p.nickname, 'Testing') as first_name,
  '' as last_name,
  u.email,
  p.company_id,
  NULL as location,
  true as active,
  false as signed_citation_policy,
  false as is_ny_driver,
  false as is_dmv_driver
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'merchtophat@gmail.com'
AND p.company_id IS NOT NULL
ON CONFLICT (email, company_id) DO NOTHING;

-- If the row already exists but user_id is missing, backfill it
UPDATE drivers d
SET user_id = u.id
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE d.email = u.email
  AND d.company_id = p.company_id
  AND u.email = 'merchtophat@gmail.com'
  AND d.user_id IS NULL;
