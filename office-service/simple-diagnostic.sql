-- ============================================================================
-- SIMPLE DATABASE DIAGNOSTIC SCRIPT
-- ============================================================================
-- Run this in your Supabase SQL Editor to diagnose the current state

-- Check if tables exist
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
            THEN 'EXISTS' ELSE 'MISSING' END as status;

-- Check profiles table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check pickups table structure (if it exists)
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'pickups'
ORDER BY ordinal_position;

-- Check current user
SELECT current_user, current_database();
