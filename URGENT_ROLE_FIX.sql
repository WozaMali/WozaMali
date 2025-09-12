-- ============================================================================
-- URGENT FIX: INSERT MISSING MEMBER ROLE
-- ============================================================================
-- This script immediately fixes the "member role not found" error
-- Run this in your Supabase SQL Editor RIGHT NOW
-- ============================================================================

-- Step 1: Insert the missing member role
INSERT INTO public.roles (name, description, permissions) 
VALUES (
    'member', 
    'Regular users who can submit collection requests', 
    '{"can_submit_collections": true, "can_view_own_data": true}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Step 2: Insert other essential roles that might be missing
INSERT INTO public.roles (name, description, permissions) 
VALUES 
    ('collector', 'Waste collection staff', '{"can_collect_waste": true, "can_view_assigned_areas": true}'::jsonb),
    ('admin', 'System administrators', '{"can_manage_all": true, "can_view_analytics": true, "can_manage_users": true}'::jsonb),
    ('office_staff', 'Office staff members', '{"can_view_analytics": true, "can_manage_collections": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Step 3: Verify the member role exists
SELECT 
    'MEMBER ROLE VERIFICATION' as status,
    name,
    id,
    description
FROM public.roles 
WHERE name = 'member';

-- Step 4: Show all available roles
SELECT 
    'ALL ROLES' as status,
    name,
    id
FROM public.roles
ORDER BY name;

-- Step 5: Test the exact query that was failing
SELECT 
    'TEST QUERY' as status,
    id
FROM public.roles
WHERE name = 'member';

RAISE NOTICE '🚀 URGENT FIX COMPLETED! The member role has been inserted.';
RAISE NOTICE 'Your dashboard should now work without the role error.';
