-- Trace where Legacy Music's wallet data is coming from
-- Run this in your Supabase SQL editor

-- Check 1: Find Legacy Music's user ID
SELECT 
  id,
  full_name,
  email,
  created_at
FROM profiles 
WHERE full_name ILIKE '%legacy%music%' 
   OR full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%';

-- Check 2: Look at Legacy Music's collections and calculate what wallet should be
SELECT 
  p.full_name,
  COUNT(DISTINCT c.id) as total_collections,
  COUNT(DISTINCT CASE WHEN c.status = 'approved' THEN c.id END) as approved_collections,
  SUM(CASE WHEN c.status = 'approved' THEN pi.quantity ELSE 0 END) as approved_weight,
  SUM(CASE WHEN c.status = 'approved' THEN pi.total_price ELSE 0 END) as approved_value,
  ROUND(SUM(CASE WHEN c.status = 'approved' THEN pi.total_price ELSE 0 END) * 0.3, 2) as calculated_wallet_balance,
  SUM(CASE WHEN c.status = 'approved' THEN pi.quantity ELSE 0 END)::INTEGER as calculated_points
FROM profiles p
LEFT JOIN collections c ON p.id = c.user_id
LEFT JOIN pickup_items pi ON c.id = pi.pickup_id
WHERE p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%'
GROUP BY p.id, p.full_name;

-- Check 3: Look at Legacy Music's individual approved collections
SELECT 
  c.id as collection_id,
  c.status,
  c.created_at as collection_date,
  SUM(pi.quantity) as total_weight,
  SUM(pi.total_price) as total_value,
  ROUND(SUM(pi.total_price) * 0.3, 2) as wallet_portion
FROM collections c
JOIN profiles p ON c.user_id = p.id
JOIN pickup_items pi ON c.id = pi.pickup_id
WHERE (p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%')
  AND c.status = 'approved'
GROUP BY c.id, c.status, c.created_at
ORDER BY c.created_at DESC;

-- Check 4: Check if there are any wallet_ledger entries for Legacy Music
SELECT 
  p.full_name,
  wl.user_id,
  wl.pickup_id,
  wl.points,
  wl.zar_amount,
  wl.fund_allocation,
  wl.description,
  wl.created_at
FROM wallet_ledger wl
JOIN profiles p ON wl.user_id = p.id
WHERE p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%'
ORDER BY wl.created_at DESC;

-- Check 5: Check if there are any payments for Legacy Music
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
WHERE p.full_name ILIKE '%legacy%music%' 
   OR p.full_name ILIKE '%legacy%'
   OR p.full_name ILIKE '%music%'
ORDER BY pay.processed_at DESC;
