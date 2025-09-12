-- Test to check what tables exist in the database
-- Run this in your Supabase SQL editor

-- Check all tables in the public schema
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if specific tables exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') 
       THEN 'EXISTS' 
       ELSE 'NOT EXISTS' 
  END as wallets_status;

SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickups') 
       THEN 'EXISTS' 
       ELSE 'NOT EXISTS' 
  END as pickups_status;

SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickup_items') 
       THEN 'EXISTS' 
       ELSE 'NOT EXISTS' 
  END as pickup_items_status;

SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials') 
       THEN 'EXISTS' 
       ELSE 'NOT EXISTS' 
  END as materials_status;

-- Check if views exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'main_app_user_wallet') 
       THEN 'EXISTS' 
       ELSE 'NOT EXISTS' 
  END as main_app_user_wallet_view_status;

SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_collections_summary') 
       THEN 'EXISTS' 
       ELSE 'NOT EXISTS' 
  END as user_collections_summary_view_status;
