-- Get live data for Legacymusicsa@gmail.com (fixed - no wallet_ledger)
-- Run this in your Supabase SQL editor

-- Step 1: Find the user by email
SELECT 
  id,
  full_name,
  email,
  created_at as profile_created
FROM profiles 
WHERE email = 'Legacymusicsa@gmail.com';

-- Step 2: Get all collections for this user
SELECT 
  c.id as collection_id,
  c.status,
  c.created_at as collection_date,
  c.updated_at as last_updated,
  COUNT(pi.id) as pickup_items_count,
  SUM(pi.quantity) as total_weight,
  SUM(pi.total_price) as total_value,
  ROUND(SUM(pi.total_price) * 0.3, 2) as wallet_portion_30_percent
FROM collections c
LEFT JOIN pickup_items pi ON c.id = pi.pickup_id
JOIN profiles p ON c.user_id = p.id
WHERE p.email = 'Legacymusicsa@gmail.com'
GROUP BY c.id, c.status, c.created_at, c.updated_at
ORDER BY c.created_at DESC;

-- Step 3: Get approved collections only with detailed breakdown
SELECT 
  c.id as collection_id,
  c.status,
  c.created_at as collection_date,
  pi.material_id,
  m.name as material_name,
  pi.quantity,
  pi.unit_price,
  pi.total_price,
  ROUND(pi.total_price * 0.3, 2) as wallet_portion
FROM collections c
JOIN pickup_items pi ON c.id = pi.pickup_id
JOIN materials m ON pi.material_id = m.id
JOIN profiles p ON c.user_id = p.id
WHERE p.email = 'Legacymusicsa@gmail.com'
  AND c.status = 'approved'
ORDER BY c.created_at DESC, pi.id;

-- Step 4: Calculate what the wallet should be
SELECT 
  p.full_name,
  p.email,
  COUNT(DISTINCT c.id) as total_approved_collections,
  SUM(pi.quantity) as total_weight_kg,
  SUM(pi.total_price) as total_collection_value,
  ROUND(SUM(pi.total_price) * 0.3, 2) as calculated_wallet_balance,
  SUM(pi.quantity)::INTEGER as calculated_points,
  CASE
    WHEN SUM(pi.quantity)::INTEGER >= 1000 THEN 'platinum'
    WHEN SUM(pi.quantity)::INTEGER >= 500 THEN 'gold'
    WHEN SUM(pi.quantity)::INTEGER >= 250 THEN 'silver'
    WHEN SUM(pi.quantity)::INTEGER >= 100 THEN 'bronze'
    ELSE 'bronze'
  END as calculated_tier
FROM profiles p
JOIN collections c ON p.id = c.user_id
JOIN pickup_items pi ON c.id = pi.pickup_id
WHERE p.email = 'Legacymusicsa@gmail.com'
  AND c.status = 'approved'
GROUP BY p.id, p.full_name, p.email;

-- Step 5: Current wallet data
SELECT 
  p.full_name,
  p.email,
  w.balance as current_balance,
  w.total_points as current_points,
  w.tier as current_tier,
  w.created_at as wallet_created,
  w.updated_at as wallet_updated
FROM profiles p
JOIN wallets w ON p.id = w.user_id
WHERE p.email = 'Legacymusicsa@gmail.com';

-- Step 6: Check if there are any payments for this user
SELECT 
  p.full_name,
  pay.pickup_id,
  pay.amount,
  pay.currency,
  pay.status,
  pay.processed_at,
  pay.method
FROM payments pay
JOIN collections c ON pay.pickup_id = c.id
JOIN profiles p ON c.user_id = p.id
WHERE p.email = 'Legacymusicsa@gmail.com'
ORDER BY pay.processed_at DESC;
