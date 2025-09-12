-- ============================================================================
-- SHOW USERS - SIMPLE VERSION
-- ============================================================================
-- Shows all users without assuming any specific table structure
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. CHECK WHAT TABLES EXIST
-- ============================================================================

-- Show all tables in public schema
SELECT 
    'PUBLIC TABLES' as info,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show all tables in auth schema
SELECT 
    'AUTH TABLES' as info,
    tablename
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- ============================================================================
-- 2. SHOW ALL USERS FROM AUTH.USERS
-- ============================================================================

-- Show all users (this table always exists in Supabase)
SELECT 
    'ALL USERS' as info,
    id as user_id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Email Confirmed'
        ELSE 'Email Not Confirmed'
    END as email_status,
    CASE 
        WHEN last_sign_in_at IS NOT NULL THEN 'Has Signed In'
        ELSE 'Never Signed In'
    END as signin_status
FROM auth.users
ORDER BY created_at DESC;

-- ============================================================================
-- 3. USER STATISTICS
-- ============================================================================

-- Count users by different criteria
SELECT 
    'USER STATISTICS' as summary,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users,
    COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as users_with_signin,
    COUNT(CASE WHEN last_sign_in_at IS NULL THEN 1 END) as users_never_signed_in
FROM auth.users;

-- ============================================================================
-- 4. RECENT USER ACTIVITY
-- ============================================================================

-- Recent user registrations
SELECT 
    'RECENT REGISTRATIONS' as activity,
    email,
    created_at,
    CASE 
        WHEN created_at > NOW() - INTERVAL '1 day' THEN 'Today'
        WHEN created_at > NOW() - INTERVAL '7 days' THEN 'Last 7 days'
        WHEN created_at > NOW() - INTERVAL '30 days' THEN 'Last 30 days'
        ELSE 'Older'
    END as registration_period
FROM auth.users
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Recent sign-ins
SELECT 
    'RECENT SIGN-INS' as activity,
    email,
    last_sign_in_at,
    CASE 
        WHEN last_sign_in_at > NOW() - INTERVAL '1 day' THEN 'Today'
        WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN 'Last 7 days'
        WHEN last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'Last 30 days'
        ELSE 'Older'
    END as signin_period
FROM auth.users
WHERE last_sign_in_at > NOW() - INTERVAL '30 days'
ORDER BY last_sign_in_at DESC;

-- ============================================================================
-- 5. CHECK FOR PROFILE TABLES (OPTIONAL)
-- ============================================================================

-- Check if profiles table exists and show users with roles
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE NOTICE 'Found profiles table - showing users with roles';
    ELSE
        RAISE NOTICE 'No profiles table found - users have no role assignments';
    END IF;
END $$;

-- Show users with roles (only if profiles table exists)
SELECT 
    'USERS WITH ROLES' as info,
    au.id as user_id,
    au.email,
    p.full_name,
    p.role,
    p.status,
    au.created_at,
    au.last_sign_in_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.role IS NOT NULL
ORDER BY au.created_at DESC;

-- ============================================================================
-- 6. USER SUMMARY BY STATUS
-- ============================================================================

-- Summary of user statuses
SELECT 
    'USER STATUS SUMMARY' as summary,
    'Total Users' as status_type,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'USER STATUS SUMMARY' as summary,
    'Email Confirmed' as status_type,
    COUNT(*) as count
FROM auth.users
WHERE email_confirmed_at IS NOT NULL
UNION ALL
SELECT 
    'USER STATUS SUMMARY' as summary,
    'Never Signed In' as status_type,
    COUNT(*) as count
FROM auth.users
WHERE last_sign_in_at IS NULL
UNION ALL
SELECT 
    'USER STATUS SUMMARY' as summary,
    'Active (Last 7 days)' as status_type,
    COUNT(*) as count
FROM auth.users
WHERE last_sign_in_at > NOW() - INTERVAL '7 days';

-- ============================================================================
-- END OF SIMPLE USERS SCHEMA
-- ============================================================================
