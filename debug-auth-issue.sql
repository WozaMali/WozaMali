-- Debug Authentication Issue
-- This will help us understand why the RLS policies are failing

-- 1. Check current authenticated user details
SELECT 
    'Current Auth Details' as info,
    auth.uid() as user_id,
    auth.role() as auth_role,
    auth.email() as auth_email;

-- 2. Check if the current user exists in the users table
SELECT 
    'User in users table' as info,
    u.id,
    u.name,
    u.role,
    u.phone,
    u.email
FROM users u 
WHERE u.id = auth.uid();

-- 3. Check all users in the users table to see what roles exist
SELECT 
    'All users in users table' as info,
    u.id,
    u.name,
    u.role,
    u.phone,
    u.email,
    u.created_at
FROM users u 
ORDER BY u.created_at DESC;

-- 4. Check if there are any users with role 'collector'
SELECT 
    'Collectors in users table' as info,
    u.id,
    u.name,
    u.role,
    u.phone,
    u.email
FROM users u 
WHERE u.role = 'collector';

-- 5. Check current RLS policies for collections
SELECT 
    'Current collections policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'collections'
ORDER BY cmd, policyname;

-- 6. Test the auth.role() function
SELECT 
    'Auth role test' as info,
    auth.role() as auth_role,
    (auth.role() = 'authenticated') as is_authenticated,
    (auth.role() = 'anon') as is_anonymous;

-- 7. Test if we can query the users table
SELECT 
    'Can query users table' as info,
    COUNT(*) as user_count
FROM users;
