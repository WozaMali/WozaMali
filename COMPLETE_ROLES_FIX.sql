-- ============================================================================
-- COMPLETE ROLES FIX
-- ============================================================================
-- This script ensures the roles table exists and has all necessary roles
-- ============================================================================

-- Step 1: Create roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Insert all essential roles
INSERT INTO public.roles (name, description, permissions) 
VALUES 
    ('member', 'Regular users who can submit collection requests', '{"can_submit_collections": true, "can_view_own_data": true}'::jsonb),
    ('collector', 'Waste collection staff', '{"can_collect_waste": true, "can_view_assigned_areas": true}'::jsonb),
    ('admin', 'System administrators', '{"can_manage_all": true, "can_view_analytics": true, "can_manage_users": true}'::jsonb),
    ('office_staff', 'Office staff members', '{"can_view_analytics": true, "can_manage_collections": true}'::jsonb),
    ('resident', 'Residents who can request collections', '{"can_submit_collections": true, "can_view_own_data": true}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Step 3: Verify all roles were created
SELECT 
    'ROLES CREATED' as status,
    name,
    id,
    description
FROM public.roles
ORDER BY name;

-- Step 4: Test the exact query that was failing
SELECT 
    'MEMBER ROLE TEST' as status,
    id,
    name
FROM public.roles
WHERE name = 'member';

-- Step 5: Check if users table has role_id column
SELECT 
    'USERS TABLE STRUCTURE' as status,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
AND column_name = 'role_id';

-- Step 6: Show sample users and their roles
SELECT 
    'SAMPLE USERS WITH ROLES' as status,
    u.id,
    u.email,
    u.role_id,
    r.name as role_name
FROM public.users u
LEFT JOIN public.roles r ON (r.id::text = u.role_id::text OR r.name = u.role_id::text)
LIMIT 5;

RAISE NOTICE '🎉 COMPLETE ROLES FIX FINISHED!';
RAISE NOTICE 'All essential roles have been created and verified.';
RAISE NOTICE 'Your dashboard should now work without role errors.';
