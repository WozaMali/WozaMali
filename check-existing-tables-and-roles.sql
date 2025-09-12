-- ============================================================================
-- CHECK EXISTING TABLES AND ROLES
-- ============================================================================
-- First, let's see what tables actually exist in your database
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. CHECK ALL EXISTING TABLES
-- ============================================================================

-- Show all tables in public schema
SELECT 
    'ALL PUBLIC TABLES' as check_type,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show all tables in auth schema (user authentication)
SELECT 
    'AUTH TABLES' as check_type,
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- ============================================================================
-- 2. CHECK FOR USER-RELATED TABLES
-- ============================================================================

-- Look for any tables that might contain user data
SELECT 
    'USER-RELATED TABLES' as check_type,
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
ORDER BY tablename;

-- ============================================================================
-- 3. CHECK AUTH.USERS TABLE (if it exists)
-- ============================================================================

-- Check if auth.users exists and its structure
SELECT 
    'AUTH.USERS STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- ============================================================================
-- 4. CHECK FOR ANY EXISTING ROLE COLUMNS
-- ============================================================================

-- Look for any columns that might contain role information
SELECT 
    'ROLE COLUMNS' as check_type,
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE column_name ILIKE '%role%'
ORDER BY table_schema, table_name, column_name;

-- ============================================================================
-- 5. CHECK FOR EXISTING DATA
-- ============================================================================

-- Check if auth.users has any data
SELECT 
    'AUTH.USERS COUNT' as check_type,
    COUNT(*) as user_count
FROM auth.users;

-- Check for any existing user data in public schema
SELECT 
    'PUBLIC USER DATA' as check_type,
    tablename,
    (SELECT COUNT(*) FROM information_schema.tables t2 WHERE t2.table_name = t1.tablename AND t2.table_schema = 'public') as table_exists
FROM pg_tables t1
WHERE schemaname = 'public'
AND (
    tablename ILIKE '%user%' OR 
    tablename ILIKE '%profile%' OR 
    tablename ILIKE '%account%' OR
    tablename ILIKE '%member%' OR
    tablename ILIKE '%resident%'
);

-- ============================================================================
-- 6. CREATE BASIC USER PROFILES TABLE IF NEEDED
-- ============================================================================

-- Create a basic profiles table if no user table exists
DO $$ 
BEGIN
    -- Check if any user table exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'user_profiles', 'users', 'members', 'residents')
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
        
        RAISE NOTICE 'Created basic profiles table';
    ELSE
        RAISE NOTICE 'User table already exists';
    END IF;
END $$;

-- ============================================================================
-- 7. SHOW FINAL TABLE STRUCTURE
-- ============================================================================

-- Show what we have now
SELECT 
    'FINAL TABLE STRUCTURE' as check_type,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show profiles table structure if it exists
SELECT 
    'PROFILES TABLE STRUCTURE' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- END OF TABLE CHECK
-- ============================================================================
