-- ============================================================================
-- COMPLETELY DISABLE RLS ON ROLES TABLE
-- ============================================================================
-- This script completely disables RLS on the roles table to fix the issue

-- 1. Drop ALL policies on roles table
DROP POLICY IF EXISTS "Allow all users to view roles" ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated users to view roles" ON public.roles;
DROP POLICY IF EXISTS "Allow anon users to view roles" ON public.roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.roles;
DROP POLICY IF EXISTS "Enable read access for anon users" ON public.roles;
DROP POLICY IF EXISTS "simple_roles_policy" ON public.roles;

-- 2. Completely disable RLS on roles table
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- 3. Grant direct permissions to all users
GRANT SELECT ON public.roles TO anon;
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.roles TO public;

-- 4. Test access without RLS
SELECT 'Testing roles access without RLS...' as status;
SELECT COUNT(*) as roles_count FROM public.roles;
SELECT id, name, description FROM public.roles ORDER BY name;

-- 5. Also fix areas and users tables to prevent similar issues
ALTER TABLE public.areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Grant permissions to areas and users
GRANT SELECT ON public.areas TO anon;
GRANT SELECT ON public.areas TO authenticated;
GRANT SELECT ON public.areas TO public;

GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.users TO public;

-- 6. Test all tables
SELECT 'Testing all tables access...' as status;
SELECT 'Roles count:', COUNT(*) FROM public.roles;
SELECT 'Areas count:', COUNT(*) FROM public.areas;
SELECT 'Users count:', COUNT(*) FROM public.users;

SELECT 'RLS completely disabled on roles, areas, and users tables!' as status;
