-- ============================================================================
-- SHOW USERS - SAFE VERSION
-- ============================================================================
-- Shows all users using only auth.users table (always exists in Supabase)
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. SHOW ALL USERS
-- ============================================================================

-- Show all users from auth.users (this table always exists)
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
-- 2. USER STATISTICS
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
-- 3. RECENT USER ACTIVITY
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
-- 4. USER SUMMARY BY STATUS
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
-- 5. CHECK WHAT TABLES EXIST (FOR REFERENCE)
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
-- 6. CREATE BASIC PROFILES TABLE (OPTIONAL)
-- ============================================================================

-- Create a basic profiles table if you want to add roles later
DO $$ 
BEGIN
    -- Check if profiles table exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'profiles'
    ) THEN
        -- Create basic profiles table
        CREATE TABLE public.profiles (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            phone TEXT,
            role TEXT DEFAULT 'member' CHECK (role IN ('member', 'resident', 'collector', 'admin', 'office_staff')),
            status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Created basic profiles table for future role assignments';
    ELSE
        RAISE NOTICE 'Profiles table already exists';
    END IF;
END $$;

-- ============================================================================
-- END OF SAFE USERS SCHEMA
-- ============================================================================
