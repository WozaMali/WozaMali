-- Simple check for collection_pickups table

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable
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

-- Check policies
SELECT 
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'collection_pickups';
