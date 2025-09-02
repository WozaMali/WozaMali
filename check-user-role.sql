-- Check User Role and Fix Access Issue
-- This will help us identify and fix the role issue for dumisani@wozamali.co.za

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

-- 3. Check all users to see what roles exist
SELECT 
    'All Users' as info,
    u.id,
    u.name,
    u.role,
    u.phone,
    u.email
FROM users u 
ORDER BY u.created_at DESC;

-- 4. Check if dumisani@wozamali.co.za exists in users table
SELECT 
    'Dumisani User Check' as info,
    u.id,
    u.name,
    u.role,
    u.phone,
    u.email
FROM users u 
WHERE u.email = 'dumisani@wozamali.co.za';

-- 5. Update dumisani@wozamali.co.za role to collector if they exist
UPDATE users 
SET role = 'collector', updated_at = NOW()
WHERE email = 'dumisani@wozamali.co.za'
RETURNING id, name, role, email;

-- 6. Verify the update
SELECT 
    'Updated Dumisani User' as info,
    u.id,
    u.name,
    u.role,
    u.phone,
    u.email
FROM users u 
WHERE u.email = 'dumisani@wozamali.co.za';
