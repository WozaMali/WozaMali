-- Test the wallet integration
-- Run this in your Supabase SQL editor

-- Test 1: Check if views exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'main_app_user_wallet') 
       THEN 'EXISTS' 
       ELSE 'NOT EXISTS' 
  END as main_app_user_wallet_status;

SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_collections_summary') 
       THEN 'EXISTS' 
       ELSE 'NOT EXISTS' 
  END as user_collections_summary_status;

-- Test 2: Check if wallets table has data
SELECT COUNT(*) as wallet_count FROM wallets;

-- Test 3: Check if profiles table has data
SELECT COUNT(*) as profile_count FROM profiles;

-- Test 4: Test the main_app_user_wallet view
SELECT 
  user_id,
  current_balance,
  total_points,
  current_tier
FROM main_app_user_wallet
LIMIT 5;

-- Test 5: Test the user_collections_summary view
SELECT 
  user_id,
  total_collections,
  total_weight,
  total_money_value
FROM user_collections_summary
LIMIT 5;
