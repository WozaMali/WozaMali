-- Check if collection_pickups table actually exists and its structure
-- This will help us understand what's happening

-- Check if the table exists
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%pickup%'
ORDER BY table_name;

-- Check the structure of collection_pickups if it exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'collection_pickups'
ORDER BY ordinal_position;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  forcerowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%pickup%';

-- Check if there are any policies on the table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename LIKE '%pickup%'
ORDER BY tablename, policyname;
