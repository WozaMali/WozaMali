-- ============================================================================
-- CHECK ROLES AND FIX RLS ISSUES
-- ============================================================================
-- This script checks what roles exist and fixes any RLS issues

-- 1. Check what roles exist in the database
SELECT 'Current roles in database:' as status;
SELECT id, name, description FROM public.roles ORDER BY name;

-- 2. Check if there are any RLS policies causing issues
SELECT 'Current RLS policies on roles table:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'roles';

-- 3. Fix RLS issues by dropping all policies and recreating them
DROP POLICY IF EXISTS "Allow all users to view roles" ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated users to view roles" ON public.roles;
DROP POLICY IF EXISTS "Allow anon users to view roles" ON public.roles;

-- 4. Disable and re-enable RLS to clear any cached policies
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 5. Create a simple, non-recursive policy
CREATE POLICY "Allow all users to view roles" ON public.roles
    FOR SELECT TO anon, authenticated
    USING (true);

-- 6. Test the fix
SELECT 'Testing roles table access...' as status;
SELECT COUNT(*) as roles_count FROM public.roles;
SELECT id, name FROM public.roles WHERE name = 'resident';

-- 7. If 'resident' role doesn't exist, create it
INSERT INTO public.roles (name, description) 
SELECT 'resident', 'Registered household or individual for collections'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'resident');

-- 8. Final test
SELECT 'Final test - all roles:' as status;
SELECT id, name, description FROM public.roles ORDER BY name;
