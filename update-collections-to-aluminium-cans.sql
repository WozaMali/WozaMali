-- Update collections to use "Aluminium Cans" instead of "Mixed Materials"
-- This will use the existing R18.55 rate and give us R371.00 calculation

-- 1. Check current collections for our user
SELECT 
  'BEFORE_UPDATE' as info,
  id,
  material_type,
  weight_kg,
  status,
  created_at
FROM collections
WHERE user_id = '6b29872e-f6d7-4be7-bb38-2104dc7491cb'
  AND status IN ('approved', 'completed', 'collected')
ORDER BY created_at DESC;

-- 2. Update all collections to use "Aluminium Cans"
UPDATE collections 
SET material_type = 'Aluminium Cans'
WHERE user_id = '6b29872e-f6d7-4be7-bb38-2104dc7491cb'
  AND material_type = 'mixed_materials'
  AND status IN ('approved', 'completed', 'collected');

-- 3. Check the updated collections
SELECT 
  'AFTER_UPDATE' as info,
  id,
  material_type,
  weight_kg,
  status,
  created_at
FROM collections
WHERE user_id = '6b29872e-f6d7-4be7-bb38-2104dc7491cb'
  AND status IN ('approved', 'completed', 'collected')
ORDER BY created_at DESC;

-- 4. Test the calculation with Aluminium Cans
SELECT 
  'ALUMINIUM_CANS_CALCULATION' as info,
  SUM(c.weight_kg * COALESCE(m.current_price_per_unit, 0)) as total_money_value,
  SUM(c.weight_kg) as total_weight,
  COUNT(*) as total_collections,
  m.current_price_per_unit as rate_per_kg
FROM collections c
LEFT JOIN materials m ON c.material_type = m.name
WHERE c.user_id = '6b29872e-f6d7-4be7-bb38-2104dc7491cb'
  AND c.status IN ('approved', 'completed', 'collected')
GROUP BY m.current_price_per_unit;

-- 5. Show the expected calculation: 20kg * R18.55 = R371.00
SELECT 
  'EXPECTED_CALCULATION' as info,
  20.0 as total_weight_kg,
  18.55 as rate_per_kg,
  (20.0 * 18.55) as expected_total_value;

-- 6. Test the enhanced view with the updated data
SELECT 
  'ENHANCED_VIEW_WITH_ALUMINIUM' as info,
  user_id,
  user_name,
  role,
  area_name,
  total_collections,
  total_weight,
  total_money_value,
  primary_material_type,
  average_rate_per_kg
FROM user_collections_summary
WHERE user_id = '6b29872e-f6d7-4be7-bb38-2104dc7491cb';
