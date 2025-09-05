-- Consolidate duplicate materials and clean up pricing
-- Remove duplicates and keep the best pricing entries

-- First, let's identify all duplicates
SELECT 
  'DUPLICATE_ANALYSIS' as info,
  name,
  COUNT(*) as count,
  STRING_AGG(current_price_per_unit::text, ', ') as prices,
  STRING_AGG(id::text, ', ') as ids
FROM materials
GROUP BY name
HAVING COUNT(*) > 1
ORDER BY name;

-- Remove duplicate Glass Bottles entries (keep the one with higher base price)
DELETE FROM materials 
WHERE name = 'Glass Bottles' 
  AND base_price_per_unit = 1.00;

-- Remove duplicate PET Bottles entries (keep the one with higher base price)
DELETE FROM materials 
WHERE name = 'PET Bottles' 
  AND base_price_per_unit = 2.50;

-- Remove duplicate Cardboard entries (keep the one with higher base price)
DELETE FROM materials 
WHERE name = 'Cardboard' 
  AND base_price_per_unit = 1.20;

-- Remove duplicate Mixed Paper entries (keep the one with higher base price)
DELETE FROM materials 
WHERE name = 'Mixed Paper' 
  AND base_price_per_unit = 0.60;

-- Show the final clean materials list
SELECT 
  'FINAL_CLEAN_MATERIALS' as info,
  name,
  current_price_per_unit,
  base_price_per_unit
FROM materials
ORDER BY current_price_per_unit DESC;

-- Show count of remaining materials
SELECT 
  'MATERIALS_COUNT' as info,
  COUNT(*) as total_materials
FROM materials;
