-- Fix role lookup issue
-- The problem is that role_id is stored as text but roles.id is UUID

-- 1. First, let's check the current role data
SELECT 
    'Current Roles' as info,
    id,
    name,
    description
FROM public.roles
ORDER BY name;

-- 2. Check the role_id values in users table
SELECT 
    'User Role IDs' as info,
    role_id,
    COUNT(*) as user_count
FROM public.users
GROUP BY role_id
ORDER BY user_count DESC;

-- 3. Fix the role lookup by updating the users table to use proper role IDs
-- First, let's see what roles we have and their IDs
SELECT 
    r.id as role_uuid,
    r.name as role_name,
    COUNT(u.id) as user_count
FROM public.roles r
LEFT JOIN public.users u ON u.role_id = r.name  -- This is likely the issue
GROUP BY r.id, r.name
ORDER BY user_count DESC;

-- 4. Update users table to use proper role UUIDs instead of role names
UPDATE public.users 
SET role_id = r.id::text
FROM public.roles r
WHERE public.users.role_id = r.name;

-- 5. Verify the fix
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.role_id,
    r.name as role_name,
    r.description as role_description
FROM public.users u
LEFT JOIN public.roles r ON u.role_id::text = r.id::text
ORDER BY u.created_at DESC;

RAISE NOTICE 'Role lookup fix completed.';
