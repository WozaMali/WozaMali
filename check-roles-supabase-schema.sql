-- ============================================================================
-- SUPABASE ROLE CHECKING SCHEMA
-- ============================================================================
-- This schema provides comprehensive role checking and management for WozaMali
-- Run this in your Supabase SQL Editor to check and manage user roles

-- ============================================================================
-- 1. ROLE CHECKING FUNCTIONS
-- ============================================================================

-- Function to get current user's role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.user_profiles 
        WHERE user_id = user_uuid
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific role
CREATE OR REPLACE FUNCTION has_role(user_uuid UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = required_role 
        FROM public.user_profiles 
        WHERE user_id = user_uuid
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION has_any_role(user_uuid UUID, roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = ANY(roles)
        FROM public.user_profiles 
        WHERE user_id = user_uuid
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_role(user_uuid, 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is collector
CREATE OR REPLACE FUNCTION is_collector(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_role(user_uuid, 'collector');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is office staff
CREATE OR REPLACE FUNCTION is_office_staff(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN has_any_role(user_uuid, ARRAY['admin', 'office_staff']);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. ROLE CHECKING VIEWS
-- ============================================================================

-- View to show all users with their roles and status
CREATE OR REPLACE VIEW role_summary AS
SELECT 
    up.user_id,
    up.email,
    up.full_name,
    up.role,
    up.status,
    up.created_at,
    up.last_login,
    up.collector_id,
    up.admin_level,
    up.office_department,
    CASE 
        WHEN up.role = 'admin' THEN 'Administrator'
        WHEN up.role = 'collector' THEN 'Collector'
        WHEN up.role = 'office_staff' THEN 'Office Staff'
        WHEN up.role = 'member' THEN 'Member'
        ELSE 'Unknown'
    END as role_display_name,
    CASE 
        WHEN up.status = 'active' THEN 'Active'
        WHEN up.status = 'inactive' THEN 'Inactive'
        WHEN up.status = 'suspended' THEN 'Suspended'
        ELSE 'Unknown'
    END as status_display_name
FROM public.user_profiles up
ORDER BY up.created_at DESC;

-- View to show role distribution
CREATE OR REPLACE VIEW role_distribution AS
SELECT 
    role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
    COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_users,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.user_profiles
GROUP BY role
ORDER BY user_count DESC;

-- View to show users by role with permissions
CREATE OR REPLACE VIEW users_by_role AS
SELECT 
    up.role,
    up.user_id,
    up.email,
    up.full_name,
    up.status,
    up.created_at,
    up.last_login,
    -- Role-specific information
    CASE 
        WHEN up.role = 'collector' THEN up.collector_id
        WHEN up.role = 'admin' THEN up.admin_level::TEXT
        WHEN up.role = 'office_staff' THEN up.office_department
        ELSE NULL
    END as role_specific_info,
    -- Permission summary
    CASE 
        WHEN up.role = 'admin' THEN 'Full Access'
        WHEN up.role = 'office_staff' THEN 'Office Management'
        WHEN up.role = 'collector' THEN 'Collection Management'
        WHEN up.role = 'member' THEN 'Basic Access'
        ELSE 'No Access'
    END as permission_level
FROM public.user_profiles up
ORDER BY 
    CASE up.role 
        WHEN 'admin' THEN 1
        WHEN 'office_staff' THEN 2
        WHEN 'collector' THEN 3
        WHEN 'member' THEN 4
        ELSE 5
    END,
    up.full_name;

-- ============================================================================
-- 3. ROLE CHECKING QUERIES
-- ============================================================================

-- Query to check current user's role
SELECT 
    'Current User Role Check' as check_type,
    auth.uid() as user_id,
    get_user_role() as current_role,
    is_admin() as is_admin,
    is_collector() as is_collector,
    is_office_staff() as is_office_staff;

-- Query to show all roles in the system
SELECT 
    'Role Distribution' as check_type,
    role,
    user_count,
    active_users,
    inactive_users,
    suspended_users,
    percentage
FROM role_distribution;

-- Query to check for users without roles
SELECT 
    'Users Without Roles' as check_type,
    COUNT(*) as count
FROM public.user_profiles 
WHERE role IS NULL OR role = '';

-- Query to check for invalid roles
SELECT 
    'Invalid Roles Check' as check_type,
    role,
    COUNT(*) as count
FROM public.user_profiles 
WHERE role NOT IN ('member', 'collector', 'admin', 'office_staff')
GROUP BY role;

-- Query to show recent role changes (if audit table exists)
SELECT 
    'Recent Role Changes' as check_type,
    COUNT(*) as recent_changes
FROM public.user_profiles 
WHERE updated_at > NOW() - INTERVAL '7 days';

-- ============================================================================
-- 4. ROLE VALIDATION FUNCTIONS
-- ============================================================================

-- Function to validate role assignment
CREATE OR REPLACE FUNCTION validate_role_assignment(
    target_user_id UUID,
    new_role TEXT,
    assigned_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN AS $$
DECLARE
    assigner_role TEXT;
    current_role TEXT;
BEGIN
    -- Get assigner's role
    SELECT role INTO assigner_role 
    FROM public.user_profiles 
    WHERE user_id = assigned_by;
    
    -- Get target user's current role
    SELECT role INTO current_role 
    FROM public.user_profiles 
    WHERE user_id = target_user_id;
    
    -- Only admins can assign roles
    IF assigner_role != 'admin' THEN
        RAISE EXCEPTION 'Only administrators can assign roles';
    END IF;
    
    -- Validate new role
    IF new_role NOT IN ('member', 'collector', 'admin', 'office_staff') THEN
        RAISE EXCEPTION 'Invalid role: %', new_role;
    END IF;
    
    -- Prevent non-admins from assigning admin role
    IF new_role = 'admin' AND assigner_role != 'admin' THEN
        RAISE EXCEPTION 'Only existing administrators can assign admin role';
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get role hierarchy
CREATE OR REPLACE FUNCTION get_role_hierarchy()
RETURNS TABLE(role TEXT, level INTEGER, permissions TEXT[]) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'admin'::TEXT as role,
        1::INTEGER as level,
        ARRAY['full_access', 'user_management', 'system_admin', 'data_export']::TEXT[] as permissions
    UNION ALL
    SELECT 
        'office_staff'::TEXT as role,
        2::INTEGER as level,
        ARRAY['office_management', 'collection_oversight', 'reporting']::TEXT[] as permissions
    UNION ALL
    SELECT 
        'collector'::TEXT as role,
        3::INTEGER as level,
        ARRAY['collection_management', 'pickup_management', 'customer_interaction']::TEXT[] as permissions
    UNION ALL
    SELECT 
        'member'::TEXT as role,
        4::INTEGER as level,
        ARRAY['basic_access', 'profile_management', 'wallet_access']::TEXT[] as permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. ROLE CHECKING REPORTS
-- ============================================================================

-- Report: Role Summary
SELECT 
    '=== ROLE SUMMARY REPORT ===' as report_section,
    '' as details;

SELECT 
    'Total Users' as metric,
    COUNT(*) as value
FROM public.user_profiles
UNION ALL
SELECT 
    'Active Users' as metric,
    COUNT(*) as value
FROM public.user_profiles 
WHERE status = 'active'
UNION ALL
SELECT 
    'Users with Roles' as metric,
    COUNT(*) as value
FROM public.user_profiles 
WHERE role IS NOT NULL AND role != '';

-- Report: Role Distribution
SELECT 
    '=== ROLE DISTRIBUTION ===' as report_section,
    '' as details;

SELECT * FROM role_distribution;

-- Report: Recent Activity
SELECT 
    '=== RECENT ACTIVITY ===' as report_section,
    '' as details;

SELECT 
    'Users Created (Last 7 days)' as metric,
    COUNT(*) as value
FROM public.user_profiles 
WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    'Users Updated (Last 7 days)' as metric,
    COUNT(*) as value
FROM public.user_profiles 
WHERE updated_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
    'Users Logged In (Last 7 days)' as metric,
    COUNT(*) as value
FROM public.user_profiles 
WHERE last_login > NOW() - INTERVAL '7 days';

-- Report: Role Hierarchy
SELECT 
    '=== ROLE HIERARCHY ===' as report_section,
    '' as details;

SELECT * FROM get_role_hierarchy();

-- ============================================================================
-- 6. ROLE MAINTENANCE QUERIES
-- ============================================================================

-- Query to find users who need role updates
SELECT 
    'Users Needing Role Updates' as check_type,
    user_id,
    email,
    full_name,
    role,
    status,
    created_at
FROM public.user_profiles 
WHERE 
    (role IS NULL OR role = '') 
    OR (status = 'active' AND last_login IS NULL)
    OR (created_at < NOW() - INTERVAL '30 days' AND role = 'member' AND last_login IS NULL)
ORDER BY created_at DESC;

-- Query to check role consistency across apps
SELECT 
    'Role Consistency Check' as check_type,
    'All users should have valid roles' as requirement,
    COUNT(*) as users_without_roles
FROM public.user_profiles 
WHERE role IS NULL OR role NOT IN ('member', 'collector', 'admin', 'office_staff');

-- ============================================================================
-- 7. USAGE EXAMPLES
-- ============================================================================

/*
-- Example 1: Check current user's role
SELECT get_user_role();

-- Example 2: Check if current user is admin
SELECT is_admin();

-- Example 3: Check if user has specific role
SELECT has_role('user-uuid-here', 'collector');

-- Example 4: Get role summary for all users
SELECT * FROM role_summary;

-- Example 5: Validate role assignment
SELECT validate_role_assignment('target-user-uuid', 'collector');

-- Example 6: Get role hierarchy
SELECT * FROM get_role_hierarchy();
*/

-- ============================================================================
-- END OF ROLE CHECKING SCHEMA
-- ============================================================================
