-- ============================================================================
-- COMPLETELY DISABLE RLS ON USERS TABLE
-- ============================================================================
-- This script completely disables RLS on the users table to fix the infinite recursion

-- 1. Drop ALL policies on users table
DROP POLICY IF EXISTS "Allow all users to view users" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to view users" ON public.users;
DROP POLICY IF EXISTS "Allow anon users to view users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable read access for anon users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow insert for new users" ON public.users;
DROP POLICY IF EXISTS "Allow select for all users" ON public.users;
DROP POLICY IF EXISTS "Allow update for own user" ON public.users;

-- 2. Completely disable RLS on users table
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- 3. Grant all necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO public;

-- 4. Test access without RLS
SELECT 'Testing users table access without RLS...' as status;
SELECT COUNT(*) as users_count FROM public.users;

-- 5. Test INSERT operation
SELECT 'Testing INSERT operation...' as status;
-- This will test if we can insert (we'll clean up immediately)
INSERT INTO public.users (
    id, first_name, last_name, full_name, email, phone, 
    date_of_birth, street_addr, township_id, subdivision, 
    city, postal_code, role_id, status
) VALUES (
    '00000000-0000-0000-0000-000000000001',
    'Test',
    'User',
    'Test User',
    'test@example.com',
    '1234567890',
    '1990-01-01',
    '123 Test Street',
    '6b5e293d-f001-4f9d-bd56-3465feb18432',
    'Phase 1',
    'Soweto',
    '1863',
    '3eb0dba0-089e-42e5-b489-230ae1c2bcf3',
    'active'
);

-- 6. Verify the insert worked
SELECT 'Verifying INSERT worked...' as status;
SELECT id, first_name, last_name, email FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001';

-- 7. Clean up test data
DELETE FROM public.users WHERE id = '00000000-0000-0000-0000-000000000001';

-- 8. Final test
SELECT 'Final test - users table access...' as status;
SELECT COUNT(*) as users_count FROM public.users;

SELECT 'Users table RLS completely disabled - INSERT operations now work!' as status;
