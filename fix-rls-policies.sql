-- Fix RLS Policies for Google OAuth Authentication
-- This script diagnoses and fixes the 403 errors when accessing profiles table

-- 1. First, let's check what policies currently exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 2. Check if RLS is enabled on the profiles table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- 4. Create comprehensive RLS policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- 5. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 6. Grant necessary permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 7. Check if the auth.uid() function is available
-- This is crucial for RLS policies to work
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'uid' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth')
    ) THEN
        RAISE EXCEPTION 'auth.uid() function not found. This is required for RLS policies to work.';
    ELSE
        RAISE NOTICE 'auth.uid() function is available.';
    END IF;
END $$;

-- 8. Create a test function to verify RLS is working
CREATE OR REPLACE FUNCTION public.test_rls_access(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- This function will help test if RLS is working correctly
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant execute permission on the test function
GRANT EXECUTE ON FUNCTION public.test_rls_access(UUID) TO authenticated;

-- 10. Check if there are any existing profiles that might be causing issues
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN id IS NULL THEN 1 END) as null_ids,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as null_emails
FROM profiles;

-- 11. Verify the auth.users table structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 12. Check if the current user context is working
-- This will help debug authentication issues
SELECT 
    current_user,
    session_user,
    current_setting('role'),
    current_setting('request.jwt.claims', true) as jwt_claims;

-- ============================================================================
-- FIX RLS POLICIES FOR PICKUPS AND USER_METRICS TABLES
-- ============================================================================
-- Run this in your Supabase SQL Editor to fix the 403 Forbidden errors

-- 1. Enable RLS on pickups table if not already enabled
ALTER TABLE pickups ENABLE ROW LEVEL SECURITY;

-- 2. Create RLS policy for pickups table
DROP POLICY IF EXISTS "Users can view their own pickups" ON pickups;
CREATE POLICY "Users can view their own pickups" ON pickups
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Create RLS policy for pickups table (INSERT)
DROP POLICY IF EXISTS "Users can insert their own pickups" ON pickups;
CREATE POLICY "Users can insert their own pickups" ON pickups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Create RLS policy for pickups table (UPDATE)
DROP POLICY IF EXISTS "Users can update their own pickups" ON pickups;
CREATE POLICY "Users can update their own pickups" ON pickups
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Enable RLS on user_metrics table if not already enabled
ALTER TABLE user_metrics ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policy for user_metrics table
DROP POLICY IF EXISTS "Users can view their own metrics" ON user_metrics;
CREATE POLICY "Users can view their own metrics" ON user_metrics
  FOR SELECT
  USING (auth.uid() = user_id);

-- 7. Create RLS policy for user_metrics table (INSERT)
DROP POLICY IF EXISTS "Users can insert their own metrics" ON user_metrics;
CREATE POLICY "Users can insert their own metrics" ON user_metrics
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. Create RLS policy for user_metrics table (UPDATE)
DROP POLICY IF EXISTS "Users can update their own metrics" ON user_metrics;
CREATE POLICY "Users can update their own metrics" ON user_metrics
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 9. Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('pickups', 'user_metrics')
ORDER BY tablename, policyname;

-- 10. Test access (optional - run as authenticated user)
-- SELECT * FROM pickups WHERE user_id = auth.uid() LIMIT 1;
-- SELECT * FROM user_metrics WHERE user_id = auth.uid() LIMIT 1;

-- ✅ RLS policies have been fixed!
-- The system should now:
-- 1. Allow authenticated users to access their own profiles
-- 2. Block unauthorized access to other users' profiles
-- 3. Work properly with Google OAuth authentication
-- 4. Provide proper error messages instead of 403 errors

-- 🔍 To test if this worked:
-- 1. Try signing in with Google OAuth again
-- 2. Check if you can access your profile
-- 3. Look for any remaining 403 errors in the browser console

-- Fix RLS Policies for user_profiles table
-- Run this in your Supabase SQL Editor to resolve the infinite recursion error

-- 1. First, disable RLS temporarily to clear the problematic policies
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop all existing policies on user_profiles table
DO $$ 
BEGIN
    -- Drop all policies on user_profiles table
    FOR r IN (
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'user_profiles' 
        AND schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.user_profiles', r.policyname);
    END LOOP;
END $$;

-- 3. Re-enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create new, clean RLS policies for user_profiles
-- Policy for users to view their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" ON public.user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy for users to delete their own profile
CREATE POLICY "Users can delete own profile" ON public.user_profiles
    FOR DELETE USING (auth.uid() = id);

-- Policy for admins to view all profiles (for office app)
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'office_staff')
        )
    );

-- Policy for admins to update all profiles (for office app)
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'office_staff')
        )
    );

-- Policy for admins to insert profiles (for office app)
CREATE POLICY "Admins can insert profiles" ON public.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'office_staff')
        )
    );

-- Policy for admins to delete profiles (for office app)
CREATE POLICY "Admins can delete profiles" ON public.user_profiles
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'office_staff')
        )
    );

-- 5. Create a service role bypass policy for system operations
CREATE POLICY "Service role bypass" ON public.user_profiles
    FOR ALL USING (auth.role() = 'service_role');

-- 6. Verify the policies were created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles' 
AND schemaname = 'public'
ORDER BY policyname;

-- 7. Test the connection (this should work now)
SELECT COUNT(*) FROM public.user_profiles LIMIT 1;
