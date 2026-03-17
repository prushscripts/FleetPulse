-- Find their auth user ID and company_id from profiles
-- then insert into drivers table

INSERT INTO drivers (
  user_id,
  name,
  email,
  company_id,
  location,
  status,
  is_ny_driver,
  is_dmv_driver
)
SELECT 
  p.id as user_id,
  COALESCE(p.nickname, 'Testing') as name,
  u.email,
  p.company_id,
  '' as location,
  'active' as status,
  false as is_ny_driver,
  false as is_dmv_driver
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE u.email = 'merchtophat@gmail.com'
AND p.company_id IS NOT NULL
ON CONFLICT (email, company_id) DO NOTHING;
