-- Check Current Supabase Database Structure
-- Run this in your Supabase SQL Editor to see what's currently deployed

-- ============================================================================
-- 1. CHECK EXISTING TABLES
-- ============================================================================

SELECT 'Current Tables in Public Schema:' as info;
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 2. CHECK TABLE STRUCTURES
-- ============================================================================

-- Check profiles table structure
SELECT 'Profiles Table Structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check wallets table structure
SELECT 'Wallets Table Structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'wallets'
ORDER BY ordinal_position;

-- Check if pickup-related tables exist
SELECT 'Pickup Tables Status:' as info;
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pickups') 
    THEN '✅ pickups table exists'
    ELSE '❌ pickups table does not exist'
  END as pickups_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pickup_items') 
    THEN '✅ pickup_items table exists'
    ELSE '❌ pickup_items table does not exist'
  END as pickup_items_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collections') 
    THEN '✅ collections table exists'
    ELSE '❌ collections table does not exist'
  END as collections_status;

-- ============================================================================
-- 3. CHECK EXISTING DATA
-- ============================================================================

-- Check user count
SELECT 'User Data Summary:' as info;
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_profiles
FROM profiles;

-- Check wallet data
SELECT 'Wallet Data Summary:' as info;
SELECT 
  COUNT(*) as total_wallets,
  SUM(balance) as total_balance,
  SUM(total_points) as total_points,
  COUNT(CASE WHEN tier = 'Gold Recycler' THEN 1 END) as gold_users
FROM wallets;

-- ============================================================================
-- 4. CHECK EXISTING VIEWS
-- ============================================================================

SELECT 'Existing Views:' as info;
SELECT 
  table_name,
  view_definition
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

-- ============================================================================
-- 5. CHECK RLS POLICIES
-- ============================================================================

SELECT 'RLS Policies:' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
