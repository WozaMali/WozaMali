-- Fix Infinite Recursion in Profiles Table RLS Policies
-- Run this in your Supabase SQL Editor to resolve the "infinite recursion detected in policy" error

-- 1. First, drop all existing policies that use auth_role() function
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "admin_profiles" ON profiles;
DROP POLICY IF EXISTS "customer_read_profile" ON profiles;

-- 2. Drop the problematic auth_role() function
DROP FUNCTION IF EXISTS auth_role() CASCADE;

-- 3. Create a safer role checking function that doesn't cause recursion
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    user_role TEXT;
BEGIN
    -- Use SECURITY DEFINER to bypass RLS when checking roles
    -- This prevents the infinite recursion
    SELECT role INTO user_role 
    FROM profiles 
    WHERE id = user_id;
    
    RETURN COALESCE(user_role, 'customer');
END;
$$;

-- 4. Create new, safer RLS policies
-- Basic user access to own profile
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin access to all profiles (using the safer function)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE USING (get_user_role() = 'admin');

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO anon;

-- 6. Verify the fix
-- Check that policies are created correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 7. Test the function (optional - run this to verify it works)
-- SELECT get_user_role() as current_user_role;

-- 8. Add a comment explaining the fix
COMMENT ON FUNCTION get_user_role(UUID) IS 'Safe function to get user role without causing RLS recursion. Use SECURITY DEFINER to bypass RLS when checking roles.';
