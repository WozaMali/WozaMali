-- Test Authentication and User Data
-- This will help us verify that the user authentication is working correctly

-- 1. Check current authentication status
SELECT 
    'Authentication Status' as info,
    auth.uid() as user_id,
    auth.role() as auth_role,
    auth.email() as auth_email;

-- 2. Check if the current user exists in users table
SELECT 
    'Current User in Users Table' as info,
    u.id,
    u.name,
    u.role,
    u.phone,
    u.email
FROM users u 
WHERE u.id = auth.uid();

-- 3. Check all users to see what's available
SELECT 
    'All Users' as info,
    u.id,
    u.name,
    u.role,
    u.phone,
    u.email
FROM users u 
ORDER BY u.created_at DESC;

-- 4. Test if we can query the collections table
SELECT 
    'Can Query Collections' as info,
    COUNT(*) as collection_count
FROM collections;

-- 5. Test if we can query the users table
SELECT 
    'Can Query Users' as info,
    COUNT(*) as user_count
FROM users;

-- 6. Test if we can query the user_addresses table
SELECT 
    'Can Query User Addresses' as info,
    COUNT(*) as address_count
FROM user_addresses;

-- 7. Test if we can query the materials table
SELECT 
    'Can Query Materials' as info,
    COUNT(*) as material_count
FROM materials;
