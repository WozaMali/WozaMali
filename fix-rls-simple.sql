-- Simple RLS Policy Fix for Google OAuth
-- This fixes the 403 errors when accessing profiles table

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- 2. Create proper RLS policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- 3. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ✅ RLS policies fixed! This should resolve the 403 errors.
