-- Case-insensitive company lookup by invite code (auth_key).
-- Run once in Supabase SQL Editor. Then invite codes work regardless of capitalization
-- (e.g. Prushlogisticsroadmap and prushlogisticsroadmap both work).

CREATE OR REPLACE FUNCTION get_company_by_invite_code(invite_code TEXT)
RETURNS TABLE (id UUID, name TEXT, auth_key TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id, c.name, c.auth_key
  FROM companies c
  WHERE LOWER(TRIM(c.auth_key)) = LOWER(TRIM(invite_code));
$$;

-- Allow authenticated users to call it
GRANT EXECUTE ON FUNCTION get_company_by_invite_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_by_invite_code(TEXT) TO anon;
