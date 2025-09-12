-- ============================================================================
-- CHECK ROLES STATUS
-- ============================================================================
-- This script checks if the roles table exists and what roles are available
-- ============================================================================

-- Check if roles table exists
SELECT 
    'ROLES TABLE EXISTS' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'roles' AND table_schema = 'public')
        THEN 'YES'
        ELSE 'NO'
    END as table_exists;

-- Check roles table structure
SELECT 
    'ROLES TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'roles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if any roles exist
SELECT 
    'ROLES COUNT' as check_type,
    COUNT(*) as total_roles
FROM public.roles;

-- Show all existing roles
SELECT 
    'EXISTING ROLES' as check_type,
    id,
    name,
    description,
    created_at
FROM public.roles
ORDER BY name;

-- Test the exact query that's failing
SELECT 
    'MEMBER ROLE QUERY TEST' as check_type,
    id,
    name
FROM public.roles
WHERE name = 'member';

-- Check if there are any users with role_id
SELECT 
    'USERS WITH ROLE_ID' as check_type,
    COUNT(*) as users_with_role_id,
    COUNT(DISTINCT role_id) as unique_role_ids
FROM public.users
WHERE role_id IS NOT NULL;

-- Show sample users and their role_ids
SELECT 
    'SAMPLE USERS' as check_type,
    id,
    email,
    role_id,
    created_at
FROM public.users
WHERE role_id IS NOT NULL
LIMIT 5;
