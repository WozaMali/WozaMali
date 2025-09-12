-- ============================================================================
-- DIAGNOSE USERS TABLE ONLY
-- ============================================================================
-- This script will help us understand the current users table structure
-- and identify the name data issue

-- 1. Check the current structure of the users table
SELECT 
    'Users Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check sample user data for legacymusicsa
SELECT 
    'Sample User Data' as info,
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    role_id,
    status,
    created_at
FROM public.users 
WHERE email = 'legacymusicsa@gmail.com'
LIMIT 1;

-- 3. Check a few other users to see the pattern
SELECT 
    'Other Users Sample' as info,
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    role_id,
    status
FROM public.users 
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check if first_name and last_name columns exist
SELECT 
    'Name Columns Check' as info,
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('first_name', 'last_name', 'full_name')
ORDER BY column_name;
