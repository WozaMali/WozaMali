-- ============================================================================
-- SHOW RESIDENT USERS SCHEMA
-- ============================================================================
-- Simple schema to show resident users in WozaMali
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. CHECK WHAT TABLES AND ROLES EXIST
-- ============================================================================

-- Check existing tables
SELECT 
    'Existing Tables' as check_type,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_profiles', 'users')
ORDER BY tablename;

-- Check profiles table structure
SELECT 
    'Profiles Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check what roles currently exist
SELECT 
    'Current Roles' as check_type,
    role,
    COUNT(*) as count
FROM public.profiles
WHERE role IS NOT NULL
GROUP BY role
ORDER BY count DESC;

-- ============================================================================
-- 2. SHOW RESIDENT USERS
-- ============================================================================

-- Show all users that are residents (role = 'resident' or 'member')
SELECT 
    'RESIDENT USERS' as user_type,
    id as user_id,
    email,
    full_name,
    phone,
    role,
    status,
    created_at,
    last_login
FROM public.profiles
WHERE role IN ('resident', 'member')
ORDER BY created_at DESC;

-- Count resident users
SELECT 
    'RESIDENT USER COUNT' as summary,
    COUNT(*) as total_residents,
    COUNT(CASE WHEN status = 'active' THEN 1 END) as active_residents,
    COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_residents,
    COUNT(CASE WHEN last_login IS NOT NULL THEN 1 END) as residents_with_login
FROM public.profiles
WHERE role IN ('resident', 'member');

-- Show resident users by status
SELECT 
    'RESIDENTS BY STATUS' as breakdown,
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.profiles
WHERE role IN ('resident', 'member')
GROUP BY status
ORDER BY count DESC;

-- Show recent resident registrations
SELECT 
    'RECENT RESIDENT REGISTRATIONS' as recent_activity,
    email,
    full_name,
    role,
    created_at
FROM public.profiles
WHERE role IN ('resident', 'member')
AND created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- ============================================================================
-- 3. RESIDENT USER FUNCTIONS
-- ============================================================================

-- Function to check if user is a resident
CREATE OR REPLACE FUNCTION is_resident(user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role IN ('resident', 'member')
        FROM public.profiles 
        WHERE id = user_uuid
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get resident count
CREATE OR REPLACE FUNCTION get_resident_count()
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.profiles
        WHERE role IN ('resident', 'member')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. RESIDENT USER VIEWS
-- ============================================================================

-- View of all resident users
CREATE OR REPLACE VIEW resident_users AS
SELECT 
    id as user_id,
    email,
    full_name,
    phone,
    role,
    status,
    created_at,
    last_login,
    CASE 
        WHEN last_login > NOW() - INTERVAL '7 days' THEN 'Active (Last 7 days)'
        WHEN last_login > NOW() - INTERVAL '30 days' THEN 'Recently Active (Last 30 days)'
        WHEN last_login IS NULL THEN 'Never Logged In'
        ELSE 'Inactive (Over 30 days)'
    END as activity_status
FROM public.profiles
WHERE role IN ('resident', 'member')
ORDER BY created_at DESC;

-- ============================================================================
-- 5. QUICK RESIDENT CHECKS
-- ============================================================================

-- Check if current user is resident
SELECT 
    'Am I a Resident?' as check_type,
    is_resident() as is_resident,
    get_user_role() as my_role;

-- Show resident user summary
SELECT 
    'RESIDENT SUMMARY' as summary_type,
    total_residents,
    active_residents,
    inactive_residents,
    residents_with_login
FROM (
    SELECT 
        COUNT(*) as total_residents,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_residents,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_residents,
        COUNT(CASE WHEN last_login IS NOT NULL THEN 1 END) as residents_with_login
    FROM public.profiles
    WHERE role IN ('resident', 'member')
) as summary;

-- Show all resident users (using view)
SELECT 
    'ALL RESIDENT USERS' as user_list,
    email,
    full_name,
    role,
    status,
    activity_status,
    created_at
FROM resident_users;

-- ============================================================================
-- 6. USAGE EXAMPLES
-- ============================================================================

/*
-- Check if you're a resident
SELECT is_resident();

-- Get total resident count
SELECT get_resident_count();

-- See all residents
SELECT * FROM resident_users;

-- See residents by activity
SELECT 
    activity_status,
    COUNT(*) as count
FROM resident_users
GROUP BY activity_status
ORDER BY count DESC;
*/

-- ============================================================================
-- END OF RESIDENT USERS SCHEMA
-- ============================================================================
