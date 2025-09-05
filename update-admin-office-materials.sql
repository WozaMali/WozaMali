-- Update Admin/Office App to ensure it uses the same materials table
-- This ensures consistency across all apps

-- 1. Check if Admin/Office has its own materials table
SELECT 
  'ADMIN_MATERIALS_TABLES' as info,
  table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%material%' OR table_name LIKE '%pricing%')
ORDER BY table_name;

-- 2. Create a view for Admin/Office that uses the main materials table
CREATE OR REPLACE VIEW admin_materials AS
SELECT 
  id,
  name,
  current_price_per_unit,
  base_price_per_unit,
  category_id,
  created_at,
  updated_at
FROM materials
ORDER BY current_price_per_unit DESC;

-- 3. Create a function to get material pricing for Admin/Office
CREATE OR REPLACE FUNCTION get_admin_material_rate(material_name TEXT)
RETURNS DECIMAL AS $$
DECLARE
  rate DECIMAL;
BEGIN
  SELECT current_price_per_unit INTO rate
  FROM materials
  WHERE name = material_name;
  
  RETURN COALESCE(rate, 0);
END;
$$ LANGUAGE plpgsql;

-- 4. Create a function to calculate total collection value for Admin/Office
CREATE OR REPLACE FUNCTION calculate_admin_collection_value(
  p_user_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  total_value DECIMAL;
BEGIN
  SELECT SUM(c.weight_kg * COALESCE(m.current_price_per_unit, 0)) INTO total_value
  FROM collections c
  LEFT JOIN materials m ON c.material_type = m.name
  WHERE c.user_id = p_user_id
    AND c.status IN ('approved', 'completed', 'collected');
  
  RETURN COALESCE(total_value, 0);
END;
$$ LANGUAGE plpgsql;

-- 5. Test the functions
SELECT 
  'ADMIN_FUNCTION_TEST' as info,
  get_admin_material_rate('Mixed Materials') as mixed_materials_rate,
  get_admin_material_rate('Aluminium Cans') as aluminium_cans_rate,
  calculate_admin_collection_value('6b29872e-f6d7-4be7-bb38-2104dc7491cb') as user_total_value;

-- 6. Show the admin materials view
SELECT 
  'ADMIN_MATERIALS_VIEW' as info,
  name,
  current_price_per_unit,
  category_id
FROM admin_materials
ORDER BY current_price_per_unit DESC;
