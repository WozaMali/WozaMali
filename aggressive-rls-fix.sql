-- ============================================================================
-- AGGRESSIVE RLS FIX - COMPLETELY RESET RLS POLICIES
-- ============================================================================
-- This script completely resets RLS policies to fix infinite recursion

-- 1. Drop ALL policies on roles table
DROP POLICY IF EXISTS "Allow all users to view roles" ON public.roles;
DROP POLICY IF EXISTS "Allow authenticated users to view roles" ON public.roles;
DROP POLICY IF EXISTS "Allow anon users to view roles" ON public.roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.roles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.roles;
DROP POLICY IF EXISTS "Enable read access for anon users" ON public.roles;

-- 2. Completely disable RLS
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- 3. Grant direct permissions
GRANT SELECT ON public.roles TO anon;
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.roles TO public;

-- 4. Test access without RLS
SELECT 'Testing roles access without RLS...' as status;
SELECT COUNT(*) as roles_count FROM public.roles;
SELECT id, name, description FROM public.roles ORDER BY name;

-- 5. Re-enable RLS with a very simple policy
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 6. Create the simplest possible policy
CREATE POLICY "simple_roles_policy" ON public.roles
    FOR SELECT
    USING (true);

-- 7. Test access with simple RLS
SELECT 'Testing roles access with simple RLS...' as status;
SELECT COUNT(*) as roles_count FROM public.roles;
SELECT id, name, description FROM public.roles ORDER BY name;

-- 8. Ensure resident role exists
INSERT INTO public.roles (name, description, permissions) 
SELECT 'resident', 'Main App users - Registered household or individual for collections', 
       '{"can_request_collections": true, "can_view_own_data": true, "can_withdraw_money": true}'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'resident');

-- 9. Final test
SELECT 'Final test - all roles:' as status;
SELECT id, name, description FROM public.roles ORDER BY name;
