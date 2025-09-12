-- Test script to verify unified signup system
-- Run this in Supabase SQL Editor to check the current state

-- 1. Check if Section 1 tables exist
SELECT 'Checking Section 1 tables...' as status;

SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('roles', 'areas', 'users') THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('roles', 'areas', 'users')
ORDER BY table_name;

-- 2. Check roles data
SELECT 'Checking roles data...' as status;
SELECT id, name, description FROM public.roles ORDER BY name;

-- 3. Check areas data (Soweto townships)
SELECT 'Checking Soweto areas data...' as status;
SELECT COUNT(*) as total_areas FROM public.areas;
SELECT name, postal_code, city FROM public.areas ORDER BY name LIMIT 5;

-- 4. Check users table structure
SELECT 'Checking users table structure...' as status;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;

-- 5. Check if views exist
SELECT 'Checking views...' as status;
SELECT 
  view_name,
  CASE 
    WHEN view_name IN ('township_dropdown', 'subdivision_dropdown', 'residents_view') THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status
FROM information_schema.views 
WHERE table_schema = 'public' 
  AND view_name IN ('township_dropdown', 'subdivision_dropdown', 'residents_view')
ORDER BY view_name;

-- 6. Test township dropdown view
SELECT 'Testing township dropdown view...' as status;
SELECT id, township_name, postal_code, city, array_length(subdivisions, 1) as subdivision_count
FROM township_dropdown 
ORDER BY township_name 
LIMIT 5;

-- 7. Test subdivision dropdown view
SELECT 'Testing subdivision dropdown view...' as status;
SELECT area_id, township_name, subdivision, postal_code
FROM subdivision_dropdown 
WHERE township_name = 'Dobsonville'
ORDER BY subdivision
LIMIT 5;

-- 8. Check current users count
SELECT 'Current users count...' as status;
SELECT COUNT(*) as total_users FROM public.users;

-- 9. Check if RLS policies exist
SELECT 'Checking RLS policies...' as status;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'roles', 'areas')
ORDER BY tablename, policyname;

-- 10. Test data insertion (this will be used for actual testing)
SELECT 'Ready for signup testing...' as status;
SELECT 'You can now test the signup flow in the Main App' as instruction;
