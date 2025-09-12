-- ============================================================================
-- SHOW USERS AND THEIR ROLES
-- ============================================================================
-- Simple schema to show all users and their roles
-- Works with different table structures
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. CHECK WHAT USER TABLES EXIST
-- ============================================================================

-- Show all tables that might contain user data
SELECT 
    'AVAILABLE USER TABLES' as info,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname IN ('public', 'auth')
AND (
    tablename ILIKE '%user%' OR 
    tablename ILIKE '%profile%' OR 
    tablename ILIKE '%account%' OR
    tablename ILIKE '%member%' OR
    tablename ILIKE '%resident%'
)
ORDER BY schemaname, tablename;

-- ============================================================================
-- 2. SHOW USERS FROM AUTH.USERS (Supabase built-in)
-- ============================================================================

-- Show all users from auth.users table
SELECT 
    'USERS FROM AUTH.USERS' as source,
    id as user_id,
    email,
    created_at,
    last_sign_in_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Email Confirmed'
        ELSE 'Email Not Confirmed'
    END as email_status
FROM auth.users
ORDER BY created_at DESC;

-- Count users by status
SELECT 
    'USER COUNT BY STATUS' as summary,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users,
    COUNT(CASE WHEN last_sign_in_at IS NOT NULL THEN 1 END) as users_with_signin
FROM auth.users;

-- ============================================================================
-- 3. TRY TO SHOW USERS FROM PUBLIC TABLES
-- ============================================================================

-- Try profiles table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        RAISE NOTICE 'Found profiles table - showing users with roles';
    ELSE
        RAISE NOTICE 'No profiles table found';
    END IF;
END $$;

-- Show users from profiles table (if it exists)
SELECT 
    'USERS FROM PROFILES TABLE' as source,
    id as user_id,
    email,
    full_name,
    role,
    status,
    created_at,
    last_login
FROM public.profiles
ORDER BY created_at DESC;

-- Try user_profiles table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
        RAISE NOTICE 'Found user_profiles table - showing users with roles';
    ELSE
        RAISE NOTICE 'No user_profiles table found';
    END IF;
END $$;

-- Show users from user_profiles table (if it exists)
SELECT 
    'USERS FROM USER_PROFILES TABLE' as source,
    user_id,
    email,
    full_name,
    role,
    status,
    created_at,
    last_login
FROM public.user_profiles
ORDER BY created_at DESC;

-- ============================================================================
-- 4. COMBINED USER VIEW (if profiles exist)
-- ============================================================================

-- Create a combined view of auth users with profile data (if profiles table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        -- Create view combining auth.users with profiles
        DROP VIEW IF EXISTS users_with_roles;
        CREATE VIEW users_with_roles AS
        SELECT 
            au.id as user_id,
            au.email,
            p.full_name,
            p.role,
            p.status,
            au.created_at as auth_created_at,
            p.created_at as profile_created_at,
            au.last_sign_in_at,
            p.last_login,
            CASE 
                WHEN p.role IS NOT NULL THEN p.role
                ELSE 'no_role'
            END as user_role,
            CASE 
                WHEN au.email_confirmed_at IS NOT NULL THEN 'confirmed'
                ELSE 'unconfirmed'
            END as email_status
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        ORDER BY au.created_at DESC;
        
        RAISE NOTICE 'Created users_with_roles view';
    ELSE
        RAISE NOTICE 'Cannot create combined view - no profiles table';
    END IF;
END $$;

-- Show combined user data (if view was created)
SELECT 
    'COMBINED USER DATA' as source,
    user_id,
    email,
    full_name,
    user_role,
    status,
    email_status,
    auth_created_at
FROM users_with_roles
ORDER BY auth_created_at DESC;

-- ============================================================================
-- 5. ROLE DISTRIBUTION (if roles exist)
-- ============================================================================

-- Show role distribution from profiles table
SELECT 
    'ROLE DISTRIBUTION' as summary,
    COALESCE(role, 'no_role') as role,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.profiles
GROUP BY role
ORDER BY count DESC;

-- ============================================================================
-- 6. RECENT USER ACTIVITY
-- ============================================================================

-- Show recent user registrations
SELECT 
    'RECENT USER REGISTRATIONS' as activity,
    id as user_id,
    email,
    created_at,
    CASE 
        WHEN created_at > NOW() - INTERVAL '7 days' THEN 'Last 7 days'
        WHEN created_at > NOW() - INTERVAL '30 days' THEN 'Last 30 days'
        ELSE 'Older'
    END as registration_period
FROM auth.users
WHERE created_at > NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Show recent sign-ins
SELECT 
    'RECENT USER SIGN-INS' as activity,
    id as user_id,
    email,
    last_sign_in_at,
    CASE 
        WHEN last_sign_in_at > NOW() - INTERVAL '7 days' THEN 'Last 7 days'
        WHEN last_sign_in_at > NOW() - INTERVAL '30 days' THEN 'Last 30 days'
        ELSE 'Older'
    END as signin_period
FROM auth.users
WHERE last_sign_in_at > NOW() - INTERVAL '30 days'
ORDER BY last_sign_in_at DESC;

-- ============================================================================
-- 7. SUMMARY STATISTICS
-- ============================================================================

-- Overall user statistics
SELECT 
    'OVERALL USER STATISTICS' as summary,
    (SELECT COUNT(*) FROM auth.users) as total_users,
    (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as confirmed_users,
    (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at IS NOT NULL) as active_users,
    (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30_days,
    (SELECT COUNT(*) FROM auth.users WHERE last_sign_in_at > NOW() - INTERVAL '7 days') as active_users_7_days;

-- ============================================================================
-- END OF USERS AND ROLES SCHEMA
-- ============================================================================
