-- ============================================================================
-- Complete Role System Setup
-- This creates the user_roles table and assigns admin role to the first user
-- ============================================================================

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'office', 'super_admin', 'collector', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 2. Create RLS policies for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS user_roles_self_select ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_select ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_insert ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_update ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_delete ON public.user_roles;

-- Policy: Users can view their own roles
CREATE POLICY user_roles_self_select ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Policy: Admins can view all roles
CREATE POLICY user_roles_admin_select ON public.user_roles
  FOR SELECT USING (public.has_any_role(ARRAY['admin', 'office', 'super_admin']));

-- Policy: Admins can insert roles
CREATE POLICY user_roles_admin_insert ON public.user_roles
  FOR INSERT WITH CHECK (public.has_any_role(ARRAY['admin', 'office', 'super_admin']));

-- Policy: Admins can update roles
CREATE POLICY user_roles_admin_update ON public.user_roles
  FOR UPDATE USING (public.has_any_role(ARRAY['admin', 'office', 'super_admin']));

-- Policy: Admins can delete roles
CREATE POLICY user_roles_admin_delete ON public.user_roles
  FOR DELETE USING (public.has_any_role(ARRAY['admin', 'office', 'super_admin']));

-- 3. Create or update the has_any_role function
CREATE OR REPLACE FUNCTION public.has_any_role(required_roles text[])
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_count integer;
BEGIN
  -- Check if the user has any of the required roles
  SELECT COUNT(*)
  INTO user_role_count
  FROM public.user_roles
  WHERE user_id = auth.uid()
    AND role = ANY(required_roles);
  
  RETURN user_role_count > 0;
END;
$$;

-- 4. Assign admin role to the first user (most recent)
INSERT INTO public.user_roles (user_id, role) 
SELECT id, 'admin' 
FROM public.users 
ORDER BY created_at ASC 
LIMIT 1
ON CONFLICT (user_id, role) DO NOTHING;

-- 5. Grant necessary permissions
GRANT SELECT ON public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- 6. Create a view for easy role checking
CREATE OR REPLACE VIEW public.user_role_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  array_agg(ur.role) as roles,
  bool_or(ur.role IN ('admin', 'office', 'super_admin')) as is_admin
FROM public.users u
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
GROUP BY u.id, u.email, u.created_at
ORDER BY u.created_at DESC;

-- Grant access to the view
GRANT SELECT ON public.user_role_summary TO authenticated;

-- ============================================================================
-- Summary
-- ============================================================================
SELECT '✅ Complete role system setup completed successfully!' AS status;
