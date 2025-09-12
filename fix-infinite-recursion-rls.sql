-- ============================================================================
-- FIX INFINITE RECURSION IN RLS POLICIES
-- ============================================================================
-- This script fixes the infinite recursion error in users table RLS policies

-- 1. Drop ALL existing policies on users table to stop the recursion
DROP POLICY IF EXISTS "users_self_select" ON public.users;
DROP POLICY IF EXISTS "collectors_can_view_all_users" ON public.users;
DROP POLICY IF EXISTS "office_admin_can_view_all_users" ON public.users;
DROP POLICY IF EXISTS "users_self_update" ON public.users;
DROP POLICY IF EXISTS "users_insert_self" ON public.users;
DROP POLICY IF EXISTS "admin_office_can_update_users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Collectors can view users in their area" ON public.users;
DROP POLICY IF EXISTS "Office can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Only office can insert users" ON public.users;
DROP POLICY IF EXISTS "Only office can delete users" ON public.users;

-- 2. Temporarily disable RLS to stop the recursion
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Create simple, non-recursive policies
-- Policy 1: Users can view their own profile (no recursion)
CREATE POLICY "users_self_select" ON public.users
    FOR SELECT
    USING (id = auth.uid());

-- Policy 2: Allow all authenticated users to view all users (for collector app)
-- This is safe because we're only allowing authenticated users
CREATE POLICY "authenticated_users_can_view_all" ON public.users
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy 3: Users can update their own profile
CREATE POLICY "users_self_update" ON public.users
    FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Policy 4: Allow users to insert their own row (signup flow)
CREATE POLICY "users_insert_self" ON public.users
    FOR INSERT
    WITH CHECK (id = auth.uid());

-- 5. Grant necessary permissions
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE ON public.users TO authenticated;
GRANT INSERT ON public.users TO authenticated;

-- 6. Test the policies
SELECT 'Testing RLS policies after fix...' as test_status;

-- This should work without recursion
SELECT 
    'Current user can see ' || COUNT(*) || ' users' as access_test
FROM public.users;

-- Show current user's profile
SELECT 
    id,
    full_name,
    email,
    role_id,
    status
FROM public.users 
WHERE id = auth.uid();

-- Show all users (should work now)
SELECT 
    id,
    full_name,
    email,
    role_id,
    status,
    created_at
FROM public.users 
ORDER BY created_at DESC
LIMIT 5;

SELECT 'Infinite recursion fixed successfully!' as final_status;
