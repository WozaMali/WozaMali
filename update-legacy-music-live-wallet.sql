-- Update Legacy Music's wallet with live data from collections
-- Run this in your Supabase SQL editor

-- First, let's get the user ID for Legacymusicsa@gmail.com
WITH user_data AS (
  SELECT id, full_name, email
  FROM profiles 
  WHERE email = 'Legacymusicsa@gmail.com'
),
collection_totals AS (
  SELECT 
    ud.id as user_id,
    ud.full_name,
    ud.email,
    COUNT(DISTINCT c.id) as approved_collections,
    SUM(pi.quantity) as total_weight,
    SUM(pi.total_price) as total_value,
    ROUND(SUM(pi.total_price) * 0.3, 2) as wallet_balance,
    SUM(pi.quantity)::INTEGER as total_points,
    CASE
      WHEN SUM(pi.quantity)::INTEGER >= 1000 THEN 'platinum'
      WHEN SUM(pi.quantity)::INTEGER >= 500 THEN 'gold'
      WHEN SUM(pi.quantity)::INTEGER >= 250 THEN 'silver'
      WHEN SUM(pi.quantity)::INTEGER >= 100 THEN 'bronze'
      ELSE 'bronze'
    END as tier
  FROM user_data ud
  JOIN collections c ON ud.id = c.user_id
  JOIN pickup_items pi ON c.id = pi.pickup_id
  WHERE c.status = 'approved'
  GROUP BY ud.id, ud.full_name, ud.email
)
-- Update the wallet with live data
UPDATE wallets 
SET 
  balance = ct.wallet_balance,
  total_points = ct.total_points,
  tier = ct.tier,
  updated_at = NOW()
FROM collection_totals ct
WHERE wallets.user_id = ct.user_id;

-- Show the updated wallet data
SELECT 
  p.full_name,
  p.email,
  w.balance,
  w.total_points,
  w.tier,
  w.updated_at
FROM profiles p
JOIN wallets w ON p.id = w.user_id
WHERE p.email = 'Legacymusicsa@gmail.com';
