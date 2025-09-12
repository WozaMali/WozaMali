-- Check the main_app_user_wallet view data
-- Run this in your Supabase SQL editor

-- Test the main_app_user_wallet view
SELECT 
  user_id,
  current_balance,
  total_points,
  current_tier,
  total_earned,
  total_weight_kg,
  total_pickups
FROM main_app_user_wallet
LIMIT 5;

-- Check if wallets table has data
SELECT 
  id,
  user_id,
  balance,
  total_points,
  tier,
  created_at
FROM wallets
LIMIT 5;
