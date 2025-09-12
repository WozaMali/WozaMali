-- ============================================================================
-- DIAGNOSE USERS ISSUE
-- ============================================================================
-- Check why users aren't showing up
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. CHECK IF AUTH.USERS TABLE EXISTS
-- ============================================================================

-- Check if auth.users table exists
SELECT 
    'AUTH.USERS TABLE CHECK' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as table_status;

-- ============================================================================
-- 2. CHECK AUTH.USERS TABLE STRUCTURE
-- ============================================================================

-- Show auth.users table structure
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
-- 3. CHECK AUTH.USERS TABLE ACCESS
-- ============================================================================

-- Check if we can access auth.users
SELECT 
    'AUTH.USERS ACCESS CHECK' as check_type,
    COUNT(*) as row_count
FROM auth.users;

-- ============================================================================
-- 4. CHECK ALL AUTH TABLES
-- ============================================================================

-- Show all tables in auth schema
SELECT 
    'ALL AUTH TABLES' as check_type,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- ============================================================================
-- 5. CHECK FOR USER DATA IN OTHER TABLES
-- ============================================================================

-- Check if there are any user-related tables in public schema
SELECT 
    'PUBLIC USER TABLES' as check_type,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
AND (
    tablename ILIKE '%user%' OR 
    tablename ILIKE '%profile%' OR 
    tablename ILIKE '%account%' OR
    tablename ILIKE '%member%' OR
    tablename ILIKE '%resident%'
)
ORDER BY tablename;

-- ============================================================================
-- 6. CHECK CURRENT USER CONTEXT
-- ============================================================================

-- Check current user and role
SELECT 
    'CURRENT USER CONTEXT' as check_type,
    current_user as current_user,
    session_user as session_user,
    current_database() as current_database,
    current_schema() as current_schema;

-- ============================================================================
-- 7. CHECK AUTH.USERS WITH DIFFERENT QUERIES
-- ============================================================================

-- Try different ways to access auth.users
SELECT 
    'AUTH.USERS COUNT (Method 1)' as check_type,
    COUNT(*) as count
FROM auth.users;

-- Try with explicit schema
SELECT 
    'AUTH.USERS COUNT (Method 2)' as check_type,
    COUNT(*) as count
FROM "auth"."users";

-- Try to see if there are any users at all
SELECT 
    'AUTH.USERS SAMPLE' as check_type,
    id,
    email,
    created_at
FROM auth.users
LIMIT 5;

-- ============================================================================
-- 8. CHECK FOR RLS POLICIES
-- ============================================================================

-- Check if there are RLS policies blocking access
SELECT 
    'RLS POLICIES ON AUTH.USERS' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'auth' 
AND tablename = 'users';

-- ============================================================================
-- 9. CHECK TABLE PERMISSIONS
-- ============================================================================

-- Check permissions on auth.users table
SELECT 
    'AUTH.USERS PERMISSIONS' as check_type,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'auth' 
AND table_name = 'users'
ORDER BY grantee, privilege_type;

-- ============================================================================
-- 10. ALTERNATIVE USER CHECK
-- ============================================================================

-- Check if users exist in any other way
SELECT 
    'ALTERNATIVE USER CHECK' as check_type,
    'auth.users' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'ALTERNATIVE USER CHECK' as check_type,
    'information_schema.tables' as table_name,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'auth';

-- ============================================================================
-- 11. CHECK FOR SUPABASE SPECIFIC TABLES
-- ============================================================================

-- Check for Supabase specific user tables
SELECT 
    'SUPABASE USER TABLES' as check_type,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname IN ('auth', 'public')
AND (
    tablename ILIKE '%user%' OR 
    tablename ILIKE '%profile%' OR 
    tablename ILIKE '%account%' OR
    tablename ILIKE '%member%' OR
    tablename ILIKE '%resident%' OR
    tablename ILIKE '%auth%'
)
ORDER BY schemaname, tablename;

-- ============================================================================
-- END OF DIAGNOSTIC
-- ============================================================================









