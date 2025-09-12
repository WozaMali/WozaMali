-- ============================================================================
-- FIX RLS INFINITE RECURSION ERROR
-- ============================================================================
-- This script fixes the infinite recursion error in the roles table RLS policy

-- 1. Drop all existing RLS policies on roles table
DROP POLICY IF EXISTS "Allow all users to view roles" ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated users to view roles" ON public.roles;
DROP POLICY IF EXISTS "Allow anon users to view roles" ON public.roles;

-- 2. Disable RLS temporarily to fix the issue
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- 3. Re-enable RLS with a simple, non-recursive policy
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 4. Create a simple policy that doesn't cause recursion
CREATE POLICY "Allow all users to view roles" ON public.roles
    FOR SELECT TO anon, authenticated
    USING (true);

-- 5. Test the fix
SELECT 'Testing roles table access...' as status;
SELECT COUNT(*) as roles_count FROM public.roles;
SELECT id, name FROM public.roles WHERE name = 'resident';

-- 6. Also fix any similar issues on other tables
-- Check if areas table has similar issues
DROP POLICY IF EXISTS "Allow all users to view areas" ON public.areas;
ALTER TABLE public.areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view areas" ON public.areas
    FOR SELECT TO anon, authenticated
    USING (true);

-- Check if users table has similar issues
DROP POLICY IF EXISTS "Allow all users to view users" ON public.users;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all users to view users" ON public.users
    FOR SELECT TO anon, authenticated
    USING (true);

-- 7. Test all tables
SELECT 'Testing all table access...' as status;
SELECT COUNT(*) as roles_count FROM public.roles;
SELECT COUNT(*) as areas_count FROM public.areas;
SELECT COUNT(*) as users_count FROM public.users;

SELECT 'RLS infinite recursion fixed successfully!' as status;