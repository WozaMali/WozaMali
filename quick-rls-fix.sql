-- Quick Fix: Disable RLS on user_profiles table
-- Run this in your Supabase SQL Editor to immediately resolve the infinite recursion error

-- 1. Disable RLS on user_profiles table (this will allow all operations temporarily)
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_profiles';

-- 3. Test the connection (this should work now)
SELECT COUNT(*) FROM public.user_profiles LIMIT 1;

-- 4. Check if there are any remaining policies
SELECT 
    schemaname,
    tablename,
    policyname
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND schemaname = 'public';

-- Note: After running this, the Office App should be able to access user_profiles
-- You can re-enable RLS later with proper policies when you're ready
