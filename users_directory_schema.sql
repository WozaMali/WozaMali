-- Users directory view and admin-safe RPC to display users in Supabase

-- 1) View: users_directory (normalizes role name via roles join)
CREATE OR REPLACE VIEW public.users_directory AS
SELECT
  u.id,
  u.email,
  u.full_name,
  u.first_name,
  u.last_name,
  u.phone,
  -- Role name preference: explicit text role -> by_id -> by_name
  COALESCE(u.role, r_by_id.name, r_by_name.name) AS role_name,
  u.role_id,
  u.status,
  u.created_at,
  u.updated_at,
  u.street_addr,
  u.city,
  u.township_id
FROM public.users u
LEFT JOIN public.roles r_by_id ON r_by_id.id::text = u.role_id::text
LEFT JOIN public.roles r_by_name ON r_by_name.name = u.role_id;

-- 2) Allow authenticated clients to select from the view (RLS on base still applies)
GRANT SELECT ON public.users_directory TO authenticated;

-- 3) Admin-safe RPC: list_users_directory() (SECURITY DEFINER)
--    Admins see ALL users; others see resident-like users (and NULL role rows)
CREATE OR REPLACE FUNCTION public.list_users_directory()
RETURNS SETOF public.users_directory
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM public.users_directory v
  WHERE (
    -- Admin/office via email allowlist or app_role claim
    lower(coalesce(auth.jwt()->>'email','')) IN ('admin@wozamali.com','superadmin@wozamali.co.za')
    OR coalesce(auth.jwt()->>'app_role','') IN ('admin','super_admin','office')
  )
  OR (
    -- Resident-like or newly created users for non-admins
    v.role_name IN ('resident','member','customer')
    OR v.role_name IS NULL
    OR v.role_id IS NULL
    OR v.role_id::text IN (
      SELECT id::text FROM public.roles WHERE name IN ('resident','member','customer')
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.list_users_directory() TO authenticated;


