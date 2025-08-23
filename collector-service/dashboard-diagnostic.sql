-- ============================================================================
-- DASHBOARD DIAGNOSTIC SCRIPT
-- ============================================================================
-- Run this in your Supabase SQL Editor to diagnose dashboard-related issues

-- Check if the database is accessible
SELECT current_user, current_database(), version();

-- Check if required tables exist
SELECT 'profiles' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') 
            THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'materials' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials') 
            THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'pickups' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickups') 
            THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'wallets' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') 
            THEN 'EXISTS' ELSE 'MISSING' END as status
UNION ALL
SELECT 'auth.users' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') 
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check profiles table structure (if it exists)
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check if there are any users in the system
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- Check for any recent authentication issues
SELECT 
  created_at,
  event_type,
  user_id,
  ip_address
FROM auth.audit_log_entries 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- Check RLS policies on profiles table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Check if there are any constraint violations
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

-- Check current database performance
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_tuples,
  n_dead_tup as dead_tuples
FROM pg_stat_user_tables 
WHERE schemaname NOT IN ('information_schema', 'pg_catalog')
ORDER BY n_live_tup DESC;
