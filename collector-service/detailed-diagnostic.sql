-- ============================================================================
-- DETAILED DATABASE DIAGNOSTIC SCRIPT
-- ============================================================================
-- Run this in your Supabase SQL Editor to check data quality and configuration

-- 1. Check database connection and version
SELECT 
  'Database Info' as section,
  current_database() as database_name,
  current_user as current_user,
  version() as postgres_version;

-- 2. Check user authentication status
SELECT 
  'User Authentication' as section,
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users,
  COUNT(CASE WHEN last_sign_in_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_last_24h
FROM auth.users;

-- 3. Check profiles table data quality
SELECT 
  'Profiles Data' as section,
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN full_name IS NOT NULL THEN 1 END) as profiles_with_names,
  COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as profiles_with_phone,
  COUNT(CASE WHEN street_address IS NOT NULL THEN 1 END) as profiles_with_address
FROM profiles;

-- 4. Check if there are any recent users
SELECT 
  'Recent Users' as section,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 5. Check RLS policies on profiles table
SELECT 
  'RLS Policies' as section,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 6. Check table row counts (fixed for newer PostgreSQL versions)
SELECT 
  'Table Statistics' as section,
  schemaname,
  relname as table_name,
  n_live_tup as row_count
FROM pg_stat_user_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY n_live_tup DESC;

-- 7. Check for any constraint violations
SELECT 
  'Constraints' as section,
  conname as constraint_name,
  contype as constraint_type
FROM pg_constraint 
WHERE conrelid IN (
  SELECT oid FROM pg_class WHERE relname IN ('profiles', 'materials', 'pickups', 'wallets')
);

-- 8. Check if there are any data issues
SELECT 
  'Data Quality Check' as section,
  'profiles_without_users' as issue_type,
  COUNT(*) as count
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'Data Quality Check' as section,
  'users_without_profiles' as issue_type,
  COUNT(*) as count
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE p.id IS NULL;
