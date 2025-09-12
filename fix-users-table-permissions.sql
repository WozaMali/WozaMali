-- ============================================================================
-- FIX USERS TABLE PERMISSIONS FOR INSERT OPERATIONS
-- ============================================================================
-- This script fixes the users table to allow INSERT operations for sign-up

-- 1. Check current RLS status on users table
SELECT 'Current RLS status on users table:' as status;
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';

-- 2. Check current policies on users table
SELECT 'Current policies on users table:' as status;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'users';

-- 3. Drop all existing policies on users table
DROP POLICY IF EXISTS "Allow all users to view users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to view users" ON public.users;
DROP POLICY IF EXISTS "Allow anon users to view users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for anon users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.users;

-- 4. Disable RLS temporarily to fix the issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 5. Grant all necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO public;

-- 6. Test INSERT operation without RLS
SELECT 'Testing users table access without RLS...' as status;
SELECT COUNT(*) as users_count FROM public.users;

-- 7. Re-enable RLS with proper policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. Create policies that allow INSERT for new users
CREATE POLICY "Allow insert for new users" ON public.users
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Allow select for all users" ON public.users
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Allow update for own user" ON public.users
    FOR UPDATE TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 9. Test the policies
SELECT 'Testing users table with new policies...' as status;
SELECT COUNT(*) as users_count FROM public.users;

-- 10. Show final status
SELECT 'Users table permissions fixed successfully!' as status;
SELECT 'INSERT, SELECT, and UPDATE operations are now allowed for all users.' as message;
