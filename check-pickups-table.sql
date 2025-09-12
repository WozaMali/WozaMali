-- Check the actual structure of the pickups table
-- Run this in your Supabase SQL editor

-- Check if pickups table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pickups' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if pickup_items table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'pickup_items' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if materials table exists and its structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'materials' 
  AND table_schema = 'public'
ORDER BY ordinal_position;
