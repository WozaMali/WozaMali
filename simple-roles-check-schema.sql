-- ============================================================================
-- SIMPLE SUPABASE ROLES CHECK SCHEMA
-- ============================================================================
-- Quick and easy role checking for WozaMali
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. SIMPLE ROLE CHECK FUNCTIONS
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.user_profiles 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin' 
        FROM public.user_profiles 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user is collector
CREATE OR REPLACE FUNCTION is_collector()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'collector' 
        FROM public.user_profiles 
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. SIMPLE ROLE CHECK VIEWS
-- ============================================================================

-- Simple view of all users and their roles
CREATE OR REPLACE VIEW user_roles AS
SELECT 
    user_id,
    email,
    full_name,
    role,
    status,
    created_at
FROM public.user_profiles
ORDER BY created_at DESC;

-- Role count summary
CREATE OR REPLACE VIEW role_counts AS
SELECT 
    role,
    COUNT(*) as count
FROM public.user_profiles
GROUP BY role
ORDER BY count DESC;

-- ============================================================================
-- 3. QUICK ROLE CHECKS
-- ============================================================================

-- Check current user's role
SELECT 
    'My Role' as check_type,
    get_user_role() as role,
    is_admin() as is_admin,
    is_collector() as is_collector;

-- Show all users and roles
SELECT 
    'All Users' as check_type,
    email,
    full_name,
    role,
    status
FROM user_roles;

-- Show role distribution
SELECT 
    'Role Counts' as check_type,
    role,
    count
FROM role_counts;

-- Check for users without roles
SELECT 
    'Users Without Roles' as check_type,
    COUNT(*) as count
FROM public.user_profiles 
WHERE role IS NULL OR role = '';

-- ============================================================================
-- 4. SIMPLE USAGE EXAMPLES
-- ============================================================================

/*
-- Check your role
SELECT get_user_role();

-- Check if you're admin
SELECT is_admin();

-- Check if you're collector
SELECT is_collector();

-- See all users
SELECT * FROM user_roles;

-- See role counts
SELECT * FROM role_counts;
*/

-- ============================================================================
-- END OF SIMPLE ROLES CHECK SCHEMA
-- ============================================================================
