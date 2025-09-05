-- Update Collector App to use "Aluminium Cans" as default material type
-- This ensures consistency with the materials table

-- 1. Check if there are any collector-specific material settings
SELECT 
  'COLLECTOR_MATERIAL_SETTINGS' as info,
  table_name,
  column_name
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%collector%' OR table_name LIKE '%pickup%')
  AND column_name LIKE '%material%'
ORDER BY table_name, column_name;

-- 2. Create a function to get the default material type for collectors
CREATE OR REPLACE FUNCTION get_default_collector_material()
RETURNS TEXT AS $$
BEGIN
  RETURN 'Aluminium Cans';
END;
$$ LANGUAGE plpgsql;

-- 3. Create a function to validate material types for collectors
CREATE OR REPLACE FUNCTION validate_collector_material(material_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM materials 
    WHERE name = material_name
  );
END;
$$ LANGUAGE plpgsql;

-- 4. Create a function to get material rate for collectors
CREATE OR REPLACE FUNCTION get_collector_material_rate(material_name TEXT)
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

-- 5. Test the functions
SELECT 
  'COLLECTOR_FUNCTIONS_TEST' as info,
  get_default_collector_material() as default_material,
  validate_collector_material('Aluminium Cans') as is_valid_aluminium,
  validate_collector_material('mixed_materials') as is_valid_mixed,
  get_collector_material_rate('Aluminium Cans') as aluminium_rate;

-- 6. Create a view for collector material options
CREATE OR REPLACE VIEW collector_material_options AS
SELECT 
  name as material_name,
  current_price_per_unit as rate_per_kg,
  category_id
FROM materials
WHERE name IN ('Aluminium Cans', 'Copper Wire', 'Mobile Phones', 'Laptops', 'Steel Cans')
ORDER BY current_price_per_unit DESC;

-- 7. Show the collector material options
SELECT 
  'COLLECTOR_MATERIAL_OPTIONS' as info,
  material_name,
  rate_per_kg,
  category_id
FROM collector_material_options;
