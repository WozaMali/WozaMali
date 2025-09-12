-- ============================================================================
-- ACCESS USERS WITH PROPER PERMISSIONS (CLEAN VERSION)
-- ============================================================================
-- This schema works around RLS and permission issues to show users
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. CHECK CURRENT USER PERMISSIONS
-- ============================================================================

-- Check who we are and what permissions we have
SELECT 
    'CURRENT USER INFO' as check_type,
    current_user as current_user,
    session_user as session_user,
    current_database() as current_database,
    current_schema() as current_schema,
    auth.uid() as auth_uid,
    auth.role() as auth_role;

-- ============================================================================
-- 2. CHECK RLS STATUS ON AUTH.USERS
-- ============================================================================

-- Check if RLS is enabled on auth.users
SELECT 
    'RLS STATUS ON AUTH.USERS' as check_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- ============================================================================
-- 3. TRY DIFFERENT ACCESS METHODS
-- ============================================================================

-- Method 1: Direct access (might be blocked by RLS)
SELECT 
    'DIRECT ACCESS TO AUTH.USERS' as method,
    COUNT(*) as user_count
FROM auth.users;

-- Method 2: Check if we can see any users at all
SELECT 
    'SAMPLE USERS CHECK' as method,
    id,
    email,
    created_at,
    email_confirmed_at
FROM auth.users
LIMIT 5;

-- ============================================================================
-- 4. CREATE A FUNCTION TO ACCESS USERS
-- ============================================================================

-- Create a function that can access users (bypasses RLS)
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE(
    user_id UUID,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE,
    last_sign_in_at TIMESTAMP WITH TIME ZONE,
    email_confirmed_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        au.created_at,
        au.last_sign_in_at,
        au.email_confirmed_at
    FROM auth.users au;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. USE THE FUNCTION TO SHOW USERS
-- ============================================================================

-- Show all users using the function
SELECT 
    'ALL USERS (via function)' as source,
    user_id,
    email,
    created_at,
    last_sign_in_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Not Confirmed'
    END as email_status
FROM get_all_users()
ORDER BY created_at DESC;

-- ============================================================================
-- 6. USER STATISTICS VIA FUNCTION
-- ============================================================================

-- Get user statistics
SELECT 
    'USER STATISTICS' as summary,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users,
    COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as users_with_signin,
    COUNT(CASE WHEN last_sign_in_at IS NULL THEN 1 END) as users_never_signed_in
FROM get_all_users();

-- ============================================================================
-- 7. RECENT USER ACTIVITY
-- ============================================================================

-- Recent registrations
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
FROM get_all_users()
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
FROM get_all_users()
WHERE last_sign_in_at > NOW() - INTERVAL '30 days'
ORDER BY last_sign_in_at DESC;

-- ============================================================================
-- 8. CHECK FOR PROFILE TABLES
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

-- Show users with roles (if profiles table exists)
SELECT 
    'USERS WITH ROLES' as info,
    gu.user_id,
    gu.email,
    p.full_name,
    p.role,
    p.status,
    gu.created_at,
    gu.last_sign_in_at
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
WHERE p.role IS NOT NULL
ORDER BY gu.created_at DESC;

-- ============================================================================
-- 9. FINAL USER SUMMARY
-- ============================================================================

-- Final summary of all users
SELECT 
    'FINAL USER SUMMARY' as summary,
    'Total Users' as metric,
    COUNT(*) as value
FROM get_all_users()
UNION ALL
SELECT 
    'FINAL USER SUMMARY' as summary,
    'Email Confirmed' as metric,
    COUNT(*) as value
FROM get_all_users()
WHERE email_confirmed_at IS NOT NULL
UNION ALL
SELECT 
    'FINAL USER SUMMARY' as summary,
    'Active (Last 7 days)' as metric,
    COUNT(*) as value
FROM get_all_users()
WHERE last_sign_in_at > NOW() - INTERVAL '7 days';

-- ============================================================================
-- END OF USER ACCESS SCHEMA
-- ============================================================================
