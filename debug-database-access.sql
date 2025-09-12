-- ============================================================================
-- DEBUG DATABASE ACCESS ISSUES
-- ============================================================================
-- This script helps debug why the views are not accessible

-- 1. Check if views exist
SELECT 'Checking if views exist...' as status;

SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views 
WHERE schemaname = 'public' 
AND viewname IN ('township_dropdown', 'subdivision_dropdown', 'residents_view', 'collector_residents');

-- 2. Check table permissions
SELECT 'Checking table permissions...' as status;

SELECT 
    table_name,
    privilege_type,
    grantee
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
AND table_name IN ('areas', 'users', 'roles')
ORDER BY table_name, grantee;

-- 3. Check RLS status
SELECT 'Checking RLS status...' as status;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('areas', 'users', 'roles');

-- 4. Check RLS policies
SELECT 'Checking RLS policies...' as status;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('areas', 'users', 'roles');

-- 5. Test direct table access
SELECT 'Testing direct table access...' as status;

SELECT COUNT(*) as areas_count FROM public.areas;
SELECT COUNT(*) as users_count FROM public.users;
SELECT COUNT(*) as roles_count FROM public.roles;

-- 6. Test view access with different approaches
SELECT 'Testing view access...' as status;

-- Try accessing views directly
SELECT COUNT(*) as township_count FROM public.township_dropdown;
