-- ============================================================================
-- SHOW USERS AND THEIR ROLES
-- ============================================================================
-- Simple query to show all users and their roles
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. SHOW ALL USERS WITH BASIC INFO
-- ============================================================================

-- Show all users with their basic information
SELECT 
    'ALL USERS' as info,
    user_id,
    email,
    created_at,
    last_sign_in_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Not Confirmed'
    END as email_status,
    CASE 
        WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN 'Active (Last 7 days)'
        WHEN last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'Active (Last 30 days)'
        WHEN last_sign_in_at IS NULL THEN 'Never Signed In'
        ELSE 'Inactive'
    END as activity_status
FROM get_all_users()
ORDER BY created_at DESC;

-- ============================================================================
-- 2. CHECK FOR PROFILES TABLE AND ROLES
-- ============================================================================

-- Check if profiles table exists
SELECT 
    'PROFILES TABLE CHECK' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as table_status;

-- ============================================================================
-- 3. SHOW USERS WITH ROLES (if profiles table exists)
-- ============================================================================

-- Show users with their roles from profiles table
SELECT 
    'USERS WITH ROLES' as info,
    gu.user_id,
    gu.email,
    p.full_name,
    p.role,
    p.status,
    gu.created_at,
    gu.last_sign_in_at,
    CASE 
        WHEN p.role IS NULL THEN 'No Role Assigned'
        ELSE p.role
    END as user_role,
    CASE 
        WHEN p.status IS NULL THEN 'No Status'
        ELSE p.status
    END as user_status
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
ORDER BY gu.created_at DESC;

-- ============================================================================
-- 4. ROLE DISTRIBUTION
-- ============================================================================

-- Show role distribution
SELECT 
    'ROLE DISTRIBUTION' as summary,
    COALESCE(p.role, 'No Role Assigned') as role,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
GROUP BY p.role
ORDER BY count DESC;

-- ============================================================================
-- 5. USERS BY ROLE
-- ============================================================================

-- Show users grouped by role
SELECT 
    'USERS BY ROLE' as info,
    COALESCE(p.role, 'No Role Assigned') as role,
    gu.email,
    p.full_name,
    p.status,
    gu.created_at,
    gu.last_sign_in_at
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
ORDER BY 
    CASE 
        WHEN p.role = 'admin' THEN 1
        WHEN p.role = 'office_staff' THEN 2
        WHEN p.role = 'collector' THEN 3
        WHEN p.role = 'member' THEN 4
        WHEN p.role = 'resident' THEN 5
        ELSE 6
    END,
    gu.email;

-- ============================================================================
-- 6. RECENT USERS WITH ROLES
-- ============================================================================

-- Show recent users and their roles
SELECT 
    'RECENT USERS WITH ROLES' as info,
    gu.email,
    p.full_name,
    COALESCE(p.role, 'No Role Assigned') as role,
    p.status,
    gu.created_at,
    CASE 
        WHEN gu.created_at > NOW() - INTERVAL '7 days' THEN 'Last 7 days'
        WHEN gu.created_at > NOW() - INTERVAL '30 days' THEN 'Last 30 days'
        ELSE 'Older'
    END as registration_period
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
WHERE gu.created_at > NOW() - INTERVAL '30 days'
ORDER BY gu.created_at DESC;

-- ============================================================================
-- 7. USERS WITHOUT ROLES
-- ============================================================================

-- Show users who don't have roles assigned
SELECT 
    'USERS WITHOUT ROLES' as info,
    gu.user_id,
    gu.email,
    gu.created_at,
    gu.last_sign_in_at,
    'No Role Assigned' as role_status
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
WHERE p.role IS NULL
ORDER BY gu.created_at DESC;

-- ============================================================================
-- 8. SUMMARY BY ROLE
-- ============================================================================

-- Summary of users by role
SELECT 
    'SUMMARY BY ROLE' as summary,
    COALESCE(p.role, 'No Role Assigned') as role,
    COUNT(*) as user_count,
    COUNT(CASE WHEN gu.email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN gu.last_sign_in_at > NOW() - INTERVAL '7 days' THEN 1 END) as active_users
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
GROUP BY p.role
ORDER BY user_count DESC;

-- ============================================================================
-- END OF USERS AND ROLES SCHEMA
-- ============================================================================
