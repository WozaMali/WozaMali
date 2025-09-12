-- Check what tables actually exist in the database
-- Run this in your Supabase SQL Editor to see what tables are available

-- 1. List all tables in the public schema
SELECT 
    'All Tables in Public Schema' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. Check for tables that might contain pickup/collection data
SELECT 
    'Tables with "pickup" or "collection" in name' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename ILIKE '%pickup%' OR tablename ILIKE '%collection%')
ORDER BY tablename;

-- 3. Check for wallet-related tables
SELECT 
    'Wallet-related Tables' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename ILIKE '%wallet%' OR tablename ILIKE '%balance%' OR tablename ILIKE '%point%')
ORDER BY tablename;

-- 4. Check for profile/user tables
SELECT 
    'Profile/User Tables' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename ILIKE '%profile%' OR tablename ILIKE '%user%')
ORDER BY tablename;

-- 5. Check for material tables
SELECT 
    'Material Tables' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename ILIKE '%material%' OR tablename ILIKE '%item%')
ORDER BY tablename;

-- 6. Check existing RLS policies
SELECT 
    'Existing RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
