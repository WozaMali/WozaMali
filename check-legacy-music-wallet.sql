-- Check Legacy Music's wallet data and pickup history
-- Run this in your Supabase SQL editor

-- Find Legacy Music's user ID and wallet data
SELECT 
  p.id as user_id,
  p.full_name,
  w.balance,
  w.total_points,
  w.tier,
  w.created_at as wallet_created,
  w.updated_at as wallet_updated
FROM profiles p
JOIN wallets w ON p.id = w.user_id
WHERE p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%';

-- Check if there are any pickups for this user
SELECT 
  p.full_name,
  pk.id as pickup_id,
  pk.status,
  pk.weight_kg,
  pk.pickup_date,
  pk.created_at
FROM profiles p
LEFT JOIN pickups pk ON p.id = pk.user_id
WHERE p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%'
ORDER BY pk.created_at DESC;

-- Check the main_app_user_wallet view for Legacy Music
SELECT 
  user_id,
  current_balance,
  total_points,
  current_tier,
  total_earned,
  total_weight_kg,
  total_pickups
FROM main_app_user_wallet
WHERE user_id IN (
  SELECT p.id 
  FROM profiles p 
  WHERE p.full_name ILIKE '%legacy%music%' 
     OR p.full_name ILIKE '%legacy%'
     OR p.full_name ILIKE '%music%'
);
