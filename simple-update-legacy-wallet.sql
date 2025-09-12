-- Simple update for Legacy Music's wallet
-- Run this in your Supabase SQL editor

-- Step 1: First, let's see what Legacy Music's data should be
SELECT 
  p.id as user_id,
  p.full_name,
  COUNT(DISTINCT c.id) as approved_collections,
  SUM(pi.quantity) as total_weight,
  SUM(pi.total_price) as total_collection_value,
  ROUND(SUM(pi.total_price) * 0.3, 2) as wallet_balance_should_be,
  SUM(pi.quantity)::INTEGER as points_should_be
FROM profiles p
JOIN collections c ON p.id = c.user_id
JOIN pickup_items pi ON c.id = pi.pickup_id
WHERE (p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%')
  AND c.status = 'approved'
GROUP BY p.id, p.full_name;

-- Step 2: Update Legacy Music's wallet (replace with actual values from step 1)
-- You'll need to replace the values below with the actual results from step 1

-- Example update (replace with actual values):
-- UPDATE wallets 
-- SET 
--   balance = 135.00,  -- Replace with actual calculated value
--   total_points = 50,  -- Replace with actual calculated value
--   tier = 'bronze',    -- Replace with calculated tier
--   updated_at = NOW()
-- WHERE user_id = '6b29872e-f6d7-4be7-bb38-2104dc7491cb';  -- Replace with actual user_id

-- Step 3: Check current wallet data
SELECT 
  p.full_name,
  w.balance,
  w.total_points,
  w.tier,
  w.updated_at
FROM profiles p
JOIN wallets w ON p.id = w.user_id
WHERE p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%';
