-- Check the structure and RLS status of collection_pickups table

-- Check the structure of collection_pickups
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
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'collection_pickups';

-- Check if there are any policies on the table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename = 'collection_pickups'
ORDER BY policyname;

-- Try to select from the table to see what error we get
SELECT COUNT(*) as row_count FROM collection_pickups;