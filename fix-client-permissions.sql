-- ============================================================================
-- FIX CLIENT-SIDE PERMISSIONS FOR ALL THREE APPS
-- ============================================================================
-- This script ensures all apps can access the views from the client side

-- 1. Grant permissions to all roles
GRANT SELECT ON public.areas TO anon;
GRANT SELECT ON public.areas TO authenticated;
GRANT SELECT ON public.users TO anon;
GRANT SELECT ON public.users TO authenticated;
GRANT SELECT ON public.roles TO anon;
GRANT SELECT ON public.roles TO authenticated;

-- 2. Grant permissions to views
GRANT SELECT ON public.township_dropdown TO anon;
GRANT SELECT ON public.township_dropdown TO authenticated;
GRANT SELECT ON public.subdivision_dropdown TO anon;
GRANT SELECT ON public.subdivision_dropdown TO authenticated;
GRANT SELECT ON public.residents_view TO anon;
GRANT SELECT ON public.residents_view TO authenticated;
GRANT SELECT ON public.collector_residents TO anon;
GRANT SELECT ON public.collector_residents TO authenticated;

-- 3. Ensure RLS policies allow access
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Allow all users to view areas" ON public.areas;
DROP POLICY IF EXISTS "Allow all users to view users" ON public.users;
DROP POLICY IF EXISTS "Allow all users to view roles" ON public.roles;

-- Create permissive policies
CREATE POLICY "Allow all users to view areas" ON public.areas
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all users to view users" ON public.users
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow all users to view roles" ON public.roles
    FOR SELECT TO anon, authenticated
    USING (true);

-- 4. Test the access
SELECT 'Testing client access...' as status;

-- Test as if we're an anonymous user
SET ROLE anon;
SELECT COUNT(*) as township_count FROM public.township_dropdown;
SELECT COUNT(*) as subdivision_count FROM public.subdivision_dropdown;
SELECT COUNT(*) as residents_count FROM public.residents_view;
RESET ROLE;

-- Test as if we're an authenticated user
SET ROLE authenticated;
SELECT COUNT(*) as township_count FROM public.township_dropdown;
SELECT COUNT(*) as subdivision_count FROM public.subdivision_dropdown;
SELECT COUNT(*) as residents_count FROM public.residents_view;
RESET ROLE;

-- 5. Show sample data
SELECT 'Sample data for client testing:' as status;
SELECT 
    id, 
    township_name, 
    postal_code, 
    city, 
    jsonb_array_length(subdivisions) as subdivision_count
FROM public.township_dropdown 
ORDER BY township_name 
LIMIT 3;

SELECT 'Client permissions fixed successfully!' as status;
