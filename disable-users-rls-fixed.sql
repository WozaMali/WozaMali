-- ============================================================================
-- DISABLE USERS TABLE RLS - FIXED VERSION
-- ============================================================================
-- This script disables RLS on the users table without violating foreign key constraints

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

-- 5. Show current users (if any)
SELECT 'Current users in database:' as status;
SELECT id, first_name, last_name, email, role_id FROM public.users LIMIT 5;

-- 6. Test that we can read from the table
SELECT 'Testing SELECT operation...' as status;
SELECT COUNT(*) as total_users FROM public.users;

-- 7. Show the foreign key constraint info
SELECT 'Foreign key constraint info:' as status;
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name='users';

-- 8. Final status
SELECT 'Users table RLS completely disabled!' as status;
SELECT 'INSERT operations will work when called from the app with valid auth.users IDs.' as message;
