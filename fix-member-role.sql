-- ============================================================================
-- QUICK FIX: INSERT MISSING MEMBER ROLE
-- ============================================================================
-- This script inserts the missing 'member' role that's causing the dashboard errors
-- ============================================================================

-- Insert the member role if it doesn't exist
INSERT INTO public.roles (name, description, permissions) 
VALUES (
    'member', 
    'Regular users who can submit collection requests', 
    '{"can_submit_collections": true, "can_view_own_data": true}'::jsonb
)
ON CONFLICT (name) DO NOTHING;

-- Verify the role was inserted
SELECT 
    'Member Role Status' as check_type,
    name,
    description,
    permissions
FROM public.roles 
WHERE name = 'member';

-- Also insert other common roles that might be missing
INSERT INTO public.roles (name, description, permissions) 
VALUES 
    ('collector', 'Waste collection staff', '{"can_collect_waste": true, "can_view_assigned_areas": true}'::jsonb),
    ('admin', 'System administrators', '{"can_manage_all": true, "can_view_analytics": true, "can_manage_users": true}'::jsonb),
    ('office_staff', 'Office staff members', '{"can_view_analytics": true, "can_manage_collections": true}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Show all available roles
SELECT 
    'All Available Roles' as check_type,
    name,
    description
FROM public.roles
ORDER BY name;

RAISE NOTICE 'Member role fix completed!';
