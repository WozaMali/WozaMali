-- Update Legacy Music's wallet with correct amount from approved collections
-- Run this in your Supabase SQL editor

-- First, let's see what Legacy Music's wallet should be
WITH legacy_music_data AS (
  SELECT 
    p.id as user_id,
    p.full_name,
    COUNT(DISTINCT c.id) as approved_collections,
    SUM(pi.quantity) as total_weight,
    SUM(pi.total_price) as total_collection_value,
    ROUND(SUM(pi.total_price) * 0.3, 2) as correct_wallet_balance,
    SUM(pi.quantity)::INTEGER as correct_total_points
  FROM profiles p
  JOIN collections c ON p.id = c.user_id
  JOIN pickup_items pi ON c.id = pi.pickup_id
  WHERE (p.full_name ILIKE '%legacy%music%' 
     OR p.full_name ILIKE '%legacy%'
     OR p.full_name ILIKE '%music%')
    AND c.status = 'approved'
  GROUP BY p.id, p.full_name
),
tier_calculation AS (
  SELECT 
    *,
    CASE
      WHEN correct_total_points >= 1000 THEN 'platinum'
      WHEN correct_total_points >= 500 THEN 'gold'
      WHEN correct_total_points >= 250 THEN 'silver'
      WHEN correct_total_points >= 100 THEN 'bronze'
      ELSE 'bronze'
    END as correct_tier
  FROM legacy_music_data
)
-- Update Legacy Music's wallet with the correct values
UPDATE wallets 
SET 
  balance = tc.correct_wallet_balance,
  total_points = tc.correct_total_points,
  tier = tc.correct_tier,
  updated_at = NOW()
FROM tier_calculation tc
WHERE wallets.user_id = tc.user_id;

-- Show the updated wallet data
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
