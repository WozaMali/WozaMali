-- Remove the R8.00 Aluminum Cans entry from materials table
-- Keep only the R18.55 Aluminum Cans entry

-- First, let's see what we have before deletion
SELECT 
  'BEFORE_DELETION' as info,
  name,
  current_price_per_unit,
  base_price_per_unit
FROM materials
WHERE name LIKE '%Aluminum%' OR name LIKE '%Aluminium%'
ORDER BY current_price_per_unit;

-- Delete the R8.00 Aluminum Cans entry
DELETE FROM materials 
WHERE name = 'Aluminum Cans' 
  AND current_price_per_unit = 8.00;

-- Verify the deletion
SELECT 
  'AFTER_DELETION' as info,
  name,
  current_price_per_unit,
  base_price_per_unit
FROM materials
WHERE name LIKE '%Aluminum%' OR name LIKE '%Aluminium%'
ORDER BY current_price_per_unit;

-- Show all remaining materials
SELECT 
  'ALL_REMAINING_MATERIALS' as info,
  name,
  current_price_per_unit,
  base_price_per_unit
FROM materials
ORDER BY current_price_per_unit DESC;
