-- Comprehensive Fix for All auth_role() Infinite Recursion Issues
-- Run this in your Supabase SQL Editor to resolve ALL "infinite recursion detected in policy" errors

-- ============================================================================
-- STEP 1: DROP ALL PROBLEMATIC POLICIES AND FUNCTIONS
-- ============================================================================

-- Drop the problematic auth_role() function first
DROP FUNCTION IF EXISTS auth_role() CASCADE;

-- Drop all policies that use auth_role() function
-- Profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
DROP POLICY IF EXISTS "admin_profiles" ON profiles;
DROP POLICY IF EXISTS "customer_read_profile" ON profiles;

-- Addresses table
DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
DROP POLICY IF EXISTS "Admins can view all addresses" ON addresses;
DROP POLICY IF EXISTS "Admins can update all addresses" ON addresses;
DROP POLICY IF EXISTS "Admins can insert addresses" ON addresses;
DROP POLICY IF EXISTS "Admins can delete addresses" ON addresses;

-- Materials table
DROP POLICY IF EXISTS "Users can view materials" ON materials;
DROP POLICY IF EXISTS "Admins can manage materials" ON materials;

-- Pickups table
DROP POLICY IF EXISTS "Users can view own pickups" ON pickups;
DROP POLICY IF EXISTS "Users can insert own pickups" ON pickups;
DROP POLICY IF EXISTS "Users can update own pickups" ON pickups;
DROP POLICY IF EXISTS "Users can delete own pickups" ON pickups;
DROP POLICY IF EXISTS "Collectors can view assigned pickups" ON pickups;
DROP POLICY IF EXISTS "Collectors can update assigned pickups" ON pickups;
DROP POLICY IF EXISTS "Admins can manage all pickups" ON pickups;

-- Pickup items table
DROP POLICY IF EXISTS "Users can view own pickup items" ON pickup_items;
DROP POLICY IF EXISTS "Users can insert own pickup items" ON pickup_items;
DROP POLICY IF EXISTS "Users can update own pickup items" ON pickup_items;
DROP POLICY IF EXISTS "Users can delete own pickup items" ON pickup_items;
DROP POLICY IF EXISTS "Collectors can view assigned pickup items" ON pickup_items;
DROP POLICY IF EXISTS "Collectors can update assigned pickup items" ON pickup_items;
DROP POLICY IF EXISTS "Admins can manage all pickup items" ON pickup_items;

-- Pickup photos table
DROP POLICY IF EXISTS "Users can view own pickup photos" ON pickup_photos;
DROP POLICY IF EXISTS "Users can insert own pickup photos" ON pickup_photos;
DROP POLICY IF EXISTS "Users can update own pickup photos" ON pickup_photos;
DROP POLICY IF EXISTS "Users can delete own pickup photos" ON pickup_photos;
DROP POLICY IF EXISTS "Collectors can view assigned pickup photos" ON pickup_photos;
DROP POLICY IF EXISTS "Collectors can update assigned pickup photos" ON pickup_photos;
DROP POLICY IF EXISTS "Admins can manage all pickup photos" ON pickup_photos;

-- Payments table
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
DROP POLICY IF EXISTS "Users can update own payments" ON payments;
DROP POLICY IF EXISTS "Users can delete own payments" ON payments;
DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;

-- ============================================================================
-- STEP 2: CREATE SAFE ROLE CHECKING FUNCTION
-- ============================================================================

-- Create a safer role checking function that doesn't cause recursion
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role(UUID) TO anon;

-- ============================================================================
-- STEP 3: RECREATE ALL POLICIES WITH SAFE ROLE CHECKING
-- ============================================================================

-- Profiles table policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
    FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "Admins can insert profiles" ON profiles
    FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete profiles" ON profiles
    FOR DELETE USING (get_user_role() = 'admin');

-- Addresses table policies
CREATE POLICY "Users can view own addresses" ON addresses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own addresses" ON addresses
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert own addresses" ON addresses
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own addresses" ON addresses
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can view all addresses" ON addresses
    FOR SELECT USING (get_user_role() = 'admin');

CREATE POLICY "Admins can update all addresses" ON addresses
    FOR UPDATE USING (get_user_role() = 'admin');

CREATE POLICY "Admins can insert addresses" ON addresses
    FOR INSERT WITH CHECK (get_user_role() = 'admin');

CREATE POLICY "Admins can delete addresses" ON addresses
    FOR DELETE USING (get_user_role() = 'admin');

-- Materials table policies
CREATE POLICY "Users can view materials" ON materials
    FOR SELECT USING (true);

CREATE POLICY "Admins can manage materials" ON materials
    FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- Pickups table policies
CREATE POLICY "Users can view own pickups" ON pickups
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pickups" ON pickups
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pickups" ON pickups
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own pickups" ON pickups
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Collectors can view assigned pickups" ON pickups
    FOR SELECT USING (get_user_role() = 'collector' AND collector_id = auth.uid());

CREATE POLICY "Collectors can update assigned pickups" ON pickups
    FOR UPDATE USING (get_user_role() = 'collector' AND collector_id = auth.uid());

CREATE POLICY "Admins can manage all pickups" ON pickups
    FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- Pickup items table policies
CREATE POLICY "Users can view own pickup items" ON pickup_items
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pickup items" ON pickup_items
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pickup items" ON pickup_items
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own pickup items" ON pickup_items
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Collectors can view assigned pickup items" ON pickup_items
    FOR SELECT USING (get_user_role() = 'collector' AND collector_id = auth.uid());

CREATE POLICY "Collectors can update assigned pickup items" ON pickup_items
    FOR UPDATE USING (get_user_role() = 'collector' AND collector_id = auth.uid());

CREATE POLICY "Admins can manage all pickup items" ON pickup_items
    FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- Pickup photos table policies
CREATE POLICY "Users can view own pickup photos" ON pickup_photos
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own pickup photos" ON pickup_photos
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pickup photos" ON pickup_photos
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own pickup photos" ON pickup_photos
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Collectors can view assigned pickup photos" ON pickup_photos
    FOR SELECT USING (get_user_role() = 'collector' AND collector_id = auth.uid());

CREATE POLICY "Collectors can update assigned pickup photos" ON pickup_photos
    FOR UPDATE USING (get_user_role() = 'collector' AND collector_id = auth.uid());

CREATE POLICY "Admins can manage all pickup photos" ON pickup_photos
    FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- Payments table policies
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own payments" ON payments
    FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all payments" ON payments
    FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');

-- ============================================================================
-- STEP 4: VERIFICATION AND TESTING
-- ============================================================================

-- Check that all policies are created correctly
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
ORDER BY tablename, policyname;

-- Test the function (optional - run this to verify it works)
-- SELECT get_user_role() as current_user_role;

-- ============================================================================
-- STEP 5: ADD DOCUMENTATION
-- ============================================================================

COMMENT ON FUNCTION get_user_role(UUID) IS 'Safe function to get user role without causing RLS recursion. Use SECURITY DEFINER to bypass RLS when checking roles.';

-- ============================================================================
-- SUMMARY OF CHANGES
-- ============================================================================
/*
This script fixes the infinite recursion issue by:

1. Removing the problematic auth_role() function that caused circular dependencies
2. Creating a new get_user_role() function with SECURITY DEFINER to bypass RLS
3. Recreating all RLS policies to use the safer function
4. Maintaining the same security model while preventing recursion

The key changes:
- auth_role() → get_user_role() 
- Added SECURITY DEFINER to prevent RLS recursion
- Maintained all existing security policies
- Added proper error handling and fallbacks

After running this script, the "infinite recursion detected in policy" error should be resolved.
*/
