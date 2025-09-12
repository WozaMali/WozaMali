-- Test the Office App table structure
-- Run this in your Supabase SQL editor

-- Test 1: Check if collections table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'collections' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 2: Check if pickup_items table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'pickup_items' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 3: Check if materials table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'materials' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Test 4: Check if there are any collections
SELECT COUNT(*) as collections_count FROM collections;

-- Test 5: Check if there are any pickup_items
SELECT COUNT(*) as pickup_items_count FROM pickup_items;

-- Test 6: Check if there are any materials
SELECT COUNT(*) as materials_count FROM materials;

-- Test 7: Sample collections data
SELECT 
  id,
  user_id,
  status,
  created_at
FROM collections
LIMIT 5;

-- Test 8: Sample pickup_items data
SELECT 
  id,
  pickup_id,
  material_id,
  quantity,
  total_price
FROM pickup_items
LIMIT 5;

-- Test 9: Sample materials data
SELECT 
  id,
  name,
  current_price_per_unit
FROM materials
LIMIT 5;
