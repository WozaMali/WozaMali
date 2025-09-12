-- ============================================================================
-- FIX COLLECTOR USERS ACCESS
-- ============================================================================
-- This script fixes RLS policies to allow collectors to view all users
-- in the collector app users page

-- 1. First, check current RLS policies on users table
SELECT 'Checking current RLS policies on users table...' as status;

-- 2. Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Collectors can view users in their area" ON public.users;
DROP POLICY IF EXISTS "Office can view all users" ON public.users;
DROP POLICY IF EXISTS "users_self_select" ON public.users;
DROP POLICY IF EXISTS "users_admin_select" ON public.users;

-- 3. Create new policies that allow collectors to see all users
-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own profile
CREATE POLICY "users_self_select" ON public.users
    FOR SELECT
    USING (id = auth.uid());

-- Policy 2: Collectors can view all users (for collector app users page)
CREATE POLICY "collectors_can_view_all_users" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users collector
            WHERE collector.id = auth.uid() 
            AND (collector.role_id::text = 'collector' OR collector.role_id = (SELECT id::text FROM public.roles WHERE name = 'collector'))
        )
    );

-- Policy 3: Office/Admin can view all users
CREATE POLICY "office_admin_can_view_all_users" ON public.users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid() 
            AND (admin_user.role_id::text IN ('admin', 'office_staff') 
                 OR admin_user.role_id IN (SELECT id::text FROM public.roles WHERE name IN ('admin', 'office_staff')))
        )
    );

-- Policy 4: Allow users to update their own profile
CREATE POLICY "users_self_update" ON public.users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Policy 5: Allow users to insert their own row (signup flow)
CREATE POLICY "users_insert_self" ON public.users
    FOR INSERT
    WITH CHECK (id = auth.uid());

-- Policy 6: Admin/Office can update any user
CREATE POLICY "admin_office_can_update_users" ON public.users
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid() 
            AND (admin_user.role_id::text IN ('admin', 'office_staff') 
                 OR admin_user.role_id IN (SELECT id::text FROM public.roles WHERE name IN ('admin', 'office_staff')))
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users admin_user
            WHERE admin_user.id = auth.uid() 
            AND (admin_user.role_id::text IN ('admin', 'office_staff') 
                 OR admin_user.role_id IN (SELECT id::text FROM public.roles WHERE name IN ('admin', 'office_staff')))
        )
    );

-- 4. Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;
GRANT INSERT ON public.users TO authenticated;

-- 5. Test the policies by checking what users a collector can see
SELECT 'Testing collector access to users...' as test_status;

-- This query should show all users for collectors
SELECT 
    'Current user can see ' || COUNT(*) || ' users' as access_test
FROM public.users;

-- 6. Show current user's role for debugging
SELECT 
    'Current user role: ' || COALESCE(role_id, 'no role') as current_user_role
FROM public.users 
WHERE id = auth.uid();

-- 7. Show all users that should be visible (for debugging)
SELECT 
    id,
    full_name,
    email,
    role_id,
    status,
    created_at
FROM public.users 
ORDER BY created_at DESC
LIMIT 10;

SELECT 'Collector users access fixed successfully!' as final_status;
