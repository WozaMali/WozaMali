-- Fix RLS for users, roles, and collections to resolve 403s in Office/Main/Collector
-- Safe to run multiple times

-- Helper: check if current user has any of the given roles via users → roles
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles text[])
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  /*
    Robust role check supporting either:
    - users.role_id storing a UUID (FK to roles.id), or
    - users.role_id storing a role name (e.g., 'admin')
  */
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    LEFT JOIN public.roles r
      ON (r.id::text = u.role_id::text OR r.name = u.role_id::text)
    WHERE u.id = auth.uid()
      AND (
        -- If roles row found, check its name
        (r.name IS NOT NULL AND r.name = ANY(required_roles))
        OR
        -- Fallback: if users.role_id holds the role name directly
        (u.role_id::text = ANY(required_roles))
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.has_any_role(text[]) TO anon, authenticated;

-- USERS ----------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop conflicting policies if they exist
DROP POLICY IF EXISTS users_self_select ON public.users;
DROP POLICY IF EXISTS users_admin_select ON public.users;
DROP POLICY IF EXISTS users_office_select ON public.users;
DROP POLICY IF EXISTS users_self_update ON public.users;
DROP POLICY IF EXISTS users_admin_update ON public.users;
DROP POLICY IF EXISTS users_insert_self ON public.users;

-- Read own user row
CREATE POLICY users_self_select ON public.users
  FOR SELECT
  USING (id = auth.uid());

-- Read users for admin/super_admin/office
CREATE POLICY users_admin_select ON public.users
  FOR SELECT
  USING (public.has_any_role(ARRAY['admin','super_admin','office']));

-- Update own row
CREATE POLICY users_self_update ON public.users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin/super_admin can update any user
CREATE POLICY users_admin_update ON public.users
  FOR UPDATE
  USING (public.has_any_role(ARRAY['admin','super_admin']))
  WITH CHECK (public.has_any_role(ARRAY['admin','super_admin']));

-- Allow users to insert their own row (app signup flow)
CREATE POLICY users_insert_self ON public.users
  FOR INSERT
  WITH CHECK (id = auth.uid());

-- ROLES ----------------------------------------------------------------------
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS roles_admin_select ON public.roles;

-- Only admin/super_admin can read roles
CREATE POLICY roles_admin_select ON public.roles
  FOR SELECT
  USING (public.has_any_role(ARRAY['admin','super_admin']));

-- COLLECTIONS ----------------------------------------------------------------
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS collections_owner_select ON public.collections;
DROP POLICY IF EXISTS collections_collector_select ON public.collections;
DROP POLICY IF EXISTS collections_admin_select ON public.collections;

-- Residents can view their own collections
CREATE POLICY collections_owner_select ON public.collections
  FOR SELECT
  USING (user_id = auth.uid());

-- Collectors can view collections assigned to them
CREATE POLICY collections_collector_select ON public.collections
  FOR SELECT
  USING (collector_id = auth.uid());

-- Office/admin/super_admin can view all collections
CREATE POLICY collections_admin_select ON public.collections
  FOR SELECT
  USING (public.has_any_role(ARRAY['office','admin','super_admin']));

-- NOTE: Writes to collections should be via controlled RPCs; add write policies as needed.


