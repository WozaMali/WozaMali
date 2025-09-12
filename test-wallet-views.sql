-- Test the wallet views to make sure they're working
-- Run this in your Supabase SQL editor

-- Test 1: Check if the views were created successfully
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('main_app_user_wallet', 'user_collections_summary')
ORDER BY table_name;

-- Test 2: Check if there are any profiles
SELECT COUNT(*) as profile_count FROM profiles;

-- Test 3: Check if there are any wallets
SELECT COUNT(*) as wallet_count FROM wallets;

-- Test 4: Test the main_app_user_wallet view with sample data
SELECT 
  user_id,
  current_balance,
  total_points,
  current_tier,
  total_earned,
  total_weight_kg
FROM main_app_user_wallet
LIMIT 3;

-- Test 5: Test the user_collections_summary view
SELECT 
  user_id,
  total_collections,
  total_weight,
  total_money_value,
  approved_collections,
  pending_collections
FROM user_collections_summary
LIMIT 3;
