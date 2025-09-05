-- Create the final working version of user_collections_summary view with Money and Material columns
-- Using the correct column names: user_addresses.user_id

-- Drop the existing view and recreate it with the correct relationships
DROP VIEW IF EXISTS user_collections_summary;

-- Create the enhanced view with Money and Material columns
CREATE VIEW user_collections_summary AS
SELECT 
  p.user_id,
  p.email as user_name,
  p.role,
  a.city as area_name, -- Use city from addresses table
  COUNT(c.id) as total_collections,
  SUM(c.weight_kg) as total_weight,
  COUNT(CASE WHEN c.status = 'approved' THEN 1 END) as approved_collections,
  COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_collections,
  -- Add Money column - calculate total value based on material rates
  SUM(c.weight_kg * COALESCE(m.current_price_per_unit, 0)) as total_money_value,
  -- Add Material column - get the most common material type
  (
    SELECT c2.material_type
    FROM collections c2
    WHERE c2.user_id = p.user_id
      AND c2.status IN ('approved', 'completed', 'collected')
    GROUP BY c2.material_type
    ORDER BY COUNT(*) DESC, SUM(c2.weight_kg) DESC
    LIMIT 1
  ) as primary_material_type,
  -- Add average rate per kg
  CASE 
    WHEN SUM(c.weight_kg) > 0 THEN SUM(c.weight_kg * COALESCE(m.current_price_per_unit, 0)) / SUM(c.weight_kg)
    ELSE 0
  END as average_rate_per_kg
FROM profiles p
LEFT JOIN collections c ON p.user_id = c.user_id
LEFT JOIN materials m ON c.material_type = m.name
LEFT JOIN user_addresses ua ON p.user_id = ua.user_id
LEFT JOIN addresses a ON ua.id = a.profile_id AND a.is_primary = true
WHERE c.status IN ('approved', 'completed', 'collected')
GROUP BY p.user_id, p.email, p.role, a.city;

-- Test the enhanced view
SELECT 
  'ENHANCED_VIEW_TEST' as info,
  user_id,
  user_name,
  role,
  area_name,
  total_collections,
  total_weight,
  approved_collections,
  pending_collections,
  total_money_value,
  primary_material_type,
  average_rate_per_kg
FROM user_collections_summary
WHERE user_id = '6b29872e-f6d7-4be7-bb38-2104dc7491cb';

-- Show all users in the enhanced view
SELECT 
  'ALL_USERS_ENHANCED_VIEW' as info,
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
LIMIT 5;
