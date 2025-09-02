-- Fix Office App RLS Issues
-- Run this in your Supabase SQL Editor to allow the office app to access user data

-- Temporarily disable RLS on user_profiles table
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- Test access to user_profiles table
SELECT COUNT(*) as total_users FROM public.user_profiles;

-- Show sample user data (first 5 users)
SELECT 
  id, 
  email, 
  full_name, 
  role, 
  status, 
  created_at
FROM public.user_profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- If you want to re-enable RLS later, run:
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
