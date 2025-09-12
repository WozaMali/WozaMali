-- Simple query for Legacymusicsa@gmail.com data
-- Run this in your Supabase SQL editor

-- Step 1: Find the user
SELECT 
  id,
  full_name,
  email
FROM profiles 
WHERE email = 'Legacymusicsa@gmail.com';

-- Step 2: Get approved collections and calculate wallet
SELECT 
  p.full_name,
  p.email,
  COUNT(DISTINCT c.id) as approved_collections,
  SUM(pi.quantity) as total_weight_kg,
  SUM(pi.total_price) as total_collection_value,
  ROUND(SUM(pi.total_price) * 0.3, 2) as calculated_wallet_balance,
  SUM(pi.quantity)::INTEGER as calculated_points
FROM profiles p
JOIN collections c ON p.id = c.user_id
JOIN pickup_items pi ON c.id = pi.pickup_id
WHERE p.email = 'Legacymusicsa@gmail.com'
  AND c.status = 'approved'
GROUP BY p.id, p.full_name, p.email;

-- Step 3: Current wallet data
SELECT 
  p.full_name,
  p.email,
  w.balance,
  w.total_points,
  w.tier
FROM profiles p
JOIN wallets w ON p.id = w.user_id
WHERE p.email = 'Legacymusicsa@gmail.com';
