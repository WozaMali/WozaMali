-- ============================================================================
-- DIAGNOSE USER SCHEMA AND DATA
-- ============================================================================
-- This script will help us understand the current database structure
-- and identify where user names are stored

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

-- 2. Check if there's a profiles table
SELECT 
    'Profiles Table Structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check sample user data for legacymusicsa
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

-- 4. Check if there are any profiles for this user
SELECT 
    'User Profile Data' as info,
    id,
    first_name,
    last_name,
    full_name,
    email,
    phone,
    role_id,
    status
FROM public.profiles 
WHERE email = 'legacymusicsa@gmail.com'
LIMIT 1;

-- 5. Check all available tables that might contain user data
SELECT 
    'Available Tables' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%user%' OR table_name LIKE '%profile%')
ORDER BY table_name;

-- 6. Check if there are any other name-related columns in users table
SELECT 
    'All Users Table Columns' as info,
    column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND (column_name LIKE '%name%' OR column_name LIKE '%first%' OR column_name LIKE '%last%')
ORDER BY column_name;
