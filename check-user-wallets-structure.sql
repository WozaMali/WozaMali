-- Check the actual structure of user_wallets table
-- Run this in your Supabase SQL Editor to see the real column names

SELECT 'User Wallets Table Structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_wallets'
ORDER BY ordinal_position;

-- Also check if there are any views that might be relevant
SELECT 'Relevant Views:' as info;
SELECT 
  table_name,
  view_definition
FROM information_schema.views 
WHERE table_schema = 'public' 
AND (table_name LIKE '%wallet%' OR table_name LIKE '%user%')
ORDER BY table_name;
