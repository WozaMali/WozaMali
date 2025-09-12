-- Fix role foreign key constraint issue
-- First, let's see what's in the roles table and users table

-- 1. Check what roles exist
SELECT 
    'Available Roles' as info,
    id,
    name,
    description,
    created_at
FROM public.roles
ORDER BY name;

-- 2. Check what role_id values are in users table
SELECT 
    'User Role IDs' as info,
    role_id,
    COUNT(*) as user_count
FROM public.users
GROUP BY role_id
ORDER BY user_count DESC;

-- 3. Check for orphaned role_id values in users table
SELECT 
    'Orphaned Role IDs' as info,
    u.role_id,
    COUNT(*) as user_count
FROM public.users u
LEFT JOIN public.roles r ON u.role_id::text = r.id::text
WHERE r.id IS NULL
GROUP BY u.role_id;

-- 4. Create missing roles if they don't exist
INSERT INTO public.roles (id, name, description, created_at)
SELECT 
    gen_random_uuid(),
    'member',
    'Regular member/resident of the community',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'member');

INSERT INTO public.roles (id, name, description, created_at)
SELECT 
    gen_random_uuid(),
    'collector',
    'Waste collector who picks up materials from residents',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'collector');

INSERT INTO public.roles (id, name, description, created_at)
SELECT 
    gen_random_uuid(),
    'admin',
    'System administrator with full access',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'admin');

INSERT INTO public.roles (id, name, description, created_at)
SELECT 
    gen_random_uuid(),
    'super_admin',
    'Super administrator with highest privileges',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'super_admin');

INSERT INTO public.roles (id, name, description, created_at)
SELECT 
    gen_random_uuid(),
    'office_staff',
    'Office staff member',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE name = 'office_staff');

-- 5. Now update users table to use proper role IDs
-- First, let's see the current state
SELECT 
    'Before Update' as info,
    u.id,
    u.email,
    u.role_id as current_role_id,
    r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON u.role_id::text = r.id::text
ORDER BY u.created_at DESC;

-- 6. Update users to use role names instead of UUIDs (temporary fix)
UPDATE public.users 
SET role_id = r.name
FROM public.roles r
WHERE public.users.role_id::text = r.id::text;

-- 7. For users with role_id that are role names, keep them as is
-- This is a temporary solution until we can properly map all roles

-- 8. Show the final state
SELECT 
    'After Update' as info,
    u.id,
    u.email,
    u.role_id,
    r.name as role_name,
    r.description as role_description
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.name
ORDER BY u.created_at DESC;

RAISE NOTICE 'Role foreign key constraint fix completed.';
