-- Test the fixed wallet integration
-- Run this in your Supabase SQL editor

-- Test 1: Check if views were created successfully
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('main_app_user_wallet', 'user_collections_summary')
ORDER BY table_name;

-- Test 2: Test the main_app_user_wallet view
SELECT 
  user_id,
  current_balance,
  total_points,
  current_tier,
  total_earned,
  total_weight_kg
FROM main_app_user_wallet
LIMIT 5;

-- Test 3: Test the user_collections_summary view
SELECT 
  user_id,
  total_collections,
  total_weight,
  total_money_value,
  approved_collections,
  pending_collections,
  primary_material_type,
  average_rate_per_kg
FROM user_collections_summary
LIMIT 5;

-- Test 4: Check if collections table has data
SELECT COUNT(*) as collections_count FROM collections;

-- Test 5: Check if pickup_items table has data
SELECT COUNT(*) as pickup_items_count FROM pickup_items;

-- Test 6: Check if materials table has data
SELECT COUNT(*) as materials_count FROM materials;

-- Test 7: Sample collections data
SELECT 
  id,
  user_id,
  status,
  created_at
FROM collections
LIMIT 3;

-- Test 8: Sample pickup_items data
SELECT 
  id,
  pickup_id,
  material_id,
  quantity,
  total_price
FROM pickup_items
LIMIT 3;
