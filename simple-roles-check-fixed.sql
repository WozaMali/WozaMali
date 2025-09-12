-- ============================================================================
-- SIMPLE SUPABASE ROLES CHECK SCHEMA (FIXED)
-- ============================================================================
-- Quick and easy role checking for WozaMali
-- Works with existing 'profiles' table
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. CHECK WHAT TABLES EXIST
-- ============================================================================

-- First, let's see what tables we have
SELECT 
    'Existing Tables' as check_type,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'user_profiles', 'users')
ORDER BY tablename;

-- Check if profiles table has role column
SELECT 
    'Profiles Table Structure' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. ADD ROLE COLUMN IF MISSING
-- ============================================================================

-- Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'member';
        RAISE NOTICE 'Added role column to profiles table';
    ELSE
        RAISE NOTICE 'Role column already exists in profiles table';
    END IF;
END $$;

-- Add role constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND constraint_name = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('member', 'collector', 'admin', 'office_staff'));
        RAISE NOTICE 'Added role constraint to profiles table';
    ELSE
        RAISE NOTICE 'Role constraint already exists in profiles table';
    END IF;
END $$;

-- ============================================================================
-- 3. SIMPLE ROLE CHECK FUNCTIONS
-- ============================================================================

-- Get current user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.profiles 
        WHERE id = auth.uid()
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
        FROM public.profiles 
        WHERE id = auth.uid()
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
        FROM public.profiles 
        WHERE id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. SIMPLE ROLE CHECK VIEWS
-- ============================================================================

-- Simple view of all users and their roles
CREATE OR REPLACE VIEW user_roles AS
SELECT 
    id as user_id,
    email,
    full_name,
    role,
    status,
    created_at
FROM public.profiles
ORDER BY created_at DESC;

-- Role count summary
CREATE OR REPLACE VIEW role_counts AS
SELECT 
    COALESCE(role, 'no_role') as role,
    COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY count DESC;

-- ============================================================================
-- 5. QUICK ROLE CHECKS
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
FROM public.profiles 
WHERE role IS NULL OR role = '';

-- ============================================================================
-- 6. SIMPLE USAGE EXAMPLES
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
-- END OF SIMPLE ROLES CHECK SCHEMA (FIXED)
-- ============================================================================
