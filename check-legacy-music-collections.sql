-- Check Legacy Music's actual collection data
-- Run this in your Supabase SQL editor

-- Find Legacy Music's user ID
SELECT 
  id,
  full_name,
  email
FROM profiles 
WHERE full_name ILIKE '%legacy%music%' 
   OR full_name ILIKE '%legacy%'
   OR full_name ILIKE '%music%';

-- Check Legacy Music's collections
SELECT 
  c.id as collection_id,
  c.user_id,
  c.status,
  c.created_at,
  c.updated_at
FROM collections c
JOIN profiles p ON c.user_id = p.id
WHERE p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%'
ORDER BY c.created_at DESC;

-- Check Legacy Music's pickup_items for approved collections
SELECT 
  pi.id as pickup_item_id,
  pi.pickup_id as collection_id,
  pi.material_id,
  pi.quantity,
  pi.total_price,
  m.name as material_name,
  m.current_price_per_unit,
  c.status as collection_status,
  c.created_at as collection_date
FROM pickup_items pi
JOIN materials m ON pi.material_id = m.id
JOIN collections c ON pi.pickup_id = c.id
JOIN profiles p ON c.user_id = p.id
WHERE (p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%')
  AND c.status = 'approved'
ORDER BY c.created_at DESC;

-- Calculate what Legacy Music's wallet should be
SELECT 
  p.full_name,
  COUNT(DISTINCT c.id) as approved_collections,
  SUM(pi.quantity) as total_weight,
  SUM(pi.total_price) as total_collection_value,
  ROUND(SUM(pi.total_price) * 0.3, 2) as wallet_balance_should_be,
  SUM(pi.quantity)::INTEGER as total_points_should_be
FROM profiles p
JOIN collections c ON p.id = c.user_id
JOIN pickup_items pi ON c.id = pi.pickup_id
WHERE (p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%')
  AND c.status = 'approved'
GROUP BY p.id, p.full_name;

-- Check current wallet balance
SELECT 
  p.full_name,
  w.balance as current_wallet_balance,
  w.total_points as current_points,
  w.tier as current_tier
FROM profiles p
JOIN wallets w ON p.id = w.user_id
WHERE p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%';
