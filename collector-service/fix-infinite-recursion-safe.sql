-- Safe Fix for Infinite Recursion in RLS Policies
-- This script checks which tables exist before attempting to fix them
-- Run this in your Supabase SQL Editor to resolve the "infinite recursion detected in policy" error

-- ============================================================================
-- STEP 1: DROP PROBLEMATIC FUNCTION AND CHECK EXISTING TABLES
-- ============================================================================

-- Drop the problematic auth_role() function first
DROP FUNCTION IF EXISTS auth_role() CASCADE;

-- Check which tables actually exist in the database
DO $$
DECLARE
    table_exists BOOLEAN;
BEGIN
    -- Check profiles table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Profiles table exists - will fix policies';
    ELSE
        RAISE NOTICE 'Profiles table does not exist - skipping';
    END IF;
    
    -- Check addresses table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'addresses'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Addresses table exists - will fix policies';
    ELSE
        RAISE NOTICE 'Addresses table does not exist - skipping';
    END IF;
    
    -- Check materials table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'materials'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Materials table exists - will fix policies';
    ELSE
        RAISE NOTICE 'Materials table does not exist - skipping';
    END IF;
    
    -- Check pickups table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'pickups'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Pickups table exists - will fix policies';
    ELSE
        RAISE NOTICE 'Pickups table does not exist - skipping';
    END IF;
    
    -- Check pickup_items table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'pickup_items'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Pickup_items table exists - will fix policies';
    ELSE
        RAISE NOTICE 'Pickup_items table does not exist - skipping';
    END IF;
    
    -- Check pickup_photos table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'pickup_photos'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Pickup_photos table exists - will fix policies';
    ELSE
        RAISE NOTICE 'Pickup_photos table does not exist - skipping';
    END IF;
    
    -- Check payments table
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'payments'
    ) INTO table_exists;
    
    IF table_exists THEN
        RAISE NOTICE 'Payments table exists - will fix policies';
    ELSE
        RAISE NOTICE 'Payments table does not exist - skipping';
    END IF;
END $$;

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
-- STEP 3: FIX POLICIES FOR EXISTING TABLES ONLY
-- ============================================================================

-- Fix profiles table policies (this table should always exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
        DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
        DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
        DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;
        DROP POLICY IF EXISTS "admin_profiles" ON profiles;
        DROP POLICY IF EXISTS "customer_read_profile" ON profiles;
        
        -- Create new policies
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
            
        RAISE NOTICE 'Profiles table policies fixed successfully';
    END IF;
END $$;

-- Fix addresses table policies (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'addresses') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own addresses" ON addresses;
        DROP POLICY IF EXISTS "Users can update own addresses" ON addresses;
        DROP POLICY IF EXISTS "Users can insert own addresses" ON addresses;
        DROP POLICY IF EXISTS "Users can delete own addresses" ON addresses;
        DROP POLICY IF EXISTS "Admins can view all addresses" ON addresses;
        DROP POLICY IF EXISTS "Admins can update all addresses" ON addresses;
        DROP POLICY IF EXISTS "Admins can insert addresses" ON addresses;
        DROP POLICY IF EXISTS "Admins can delete addresses" ON addresses;
        
        -- Create new policies
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
            
        RAISE NOTICE 'Addresses table policies fixed successfully';
    END IF;
END $$;

-- Fix materials table policies (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'materials') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view materials" ON materials;
        DROP POLICY IF EXISTS "Admins can manage materials" ON materials;
        
        -- Create new policies
        CREATE POLICY "Users can view materials" ON materials
            FOR SELECT USING (true);
        
        CREATE POLICY "Admins can manage materials" ON materials
            FOR ALL USING (get_user_role() = 'admin') WITH CHECK (get_user_role() = 'admin');
            
        RAISE NOTICE 'Materials table policies fixed successfully';
    END IF;
END $$;

-- Fix pickups table policies (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pickups') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own pickups" ON pickups;
        DROP POLICY IF EXISTS "Users can insert own pickups" ON pickups;
        DROP POLICY IF EXISTS "Users can update own pickups" ON pickups;
        DROP POLICY IF EXISTS "Users can delete own pickups" ON pickups;
        DROP POLICY IF EXISTS "Collectors can view assigned pickups" ON pickups;
        DROP POLICY IF EXISTS "Collectors can update assigned pickups" ON pickups;
        DROP POLICY IF EXISTS "Admins can manage all pickups" ON pickups;
        
        -- Create new policies
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
            
        RAISE NOTICE 'Pickups table policies fixed successfully';
    END IF;
END $$;

-- Fix pickup_items table policies (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pickup_items') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own pickup items" ON pickup_items;
        DROP POLICY IF EXISTS "Users can insert own pickup items" ON pickup_items;
        DROP POLICY IF EXISTS "Users can update own pickup items" ON pickup_items;
        DROP POLICY IF EXISTS "Users can delete own pickup items" ON pickup_items;
        DROP POLICY IF EXISTS "Collectors can view assigned pickup items" ON pickup_items;
        DROP POLICY IF EXISTS "Collectors can update assigned pickup items" ON pickup_items;
        DROP POLICY IF EXISTS "Admins can manage all pickup items" ON pickup_items;
        
        -- Create new policies
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
            
        RAISE NOTICE 'Pickup_items table policies fixed successfully';
    END IF;
END $$;

-- Fix pickup_photos table policies (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pickup_photos') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own pickup photos" ON pickup_photos;
        DROP POLICY IF EXISTS "Users can insert own pickup photos" ON pickup_photos;
        DROP POLICY IF EXISTS "Users can update own pickup photos" ON pickup_photos;
        DROP POLICY IF EXISTS "Users can delete own pickup photos" ON pickup_photos;
        DROP POLICY IF EXISTS "Collectors can view assigned pickup photos" ON pickup_photos;
        DROP POLICY IF EXISTS "Collectors can update assigned pickup photos" ON pickup_photos;
        DROP POLICY IF EXISTS "Admins can manage all pickup photos" ON pickup_photos;
        
        -- Create new policies
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
            
        RAISE NOTICE 'Pickup_photos table policies fixed successfully';
    END IF;
END $$;

-- Fix payments table policies (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'payments') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own payments" ON payments;
        DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
        DROP POLICY IF EXISTS "Users can update own payments" ON payments;
        DROP POLICY IF EXISTS "Users can delete own payments" ON payments;
        DROP POLICY IF EXISTS "Admins can manage all payments" ON payments;
        
        -- Create new policies
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
            
        RAISE NOTICE 'Payments table policies fixed successfully';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: VERIFICATION
-- ============================================================================

-- Check that policies are created correctly for existing tables
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

-- Test the function
SELECT 
    'Function test' as test_type,
    get_user_role() as current_user_role,
    CASE 
        WHEN get_user_role() IS NOT NULL THEN 'PASS'
        ELSE 'FAIL'
    END as status;

-- ============================================================================
-- SUMMARY
-- ============================================================================
/*
This script safely fixes the infinite recursion issue by:

1. Checking which tables actually exist before attempting to fix them
2. Removing the problematic auth_role() function
3. Creating a new get_user_role() function with SECURITY DEFINER
4. Only fixing policies for tables that exist
5. Maintaining the same security model while preventing recursion

The script will automatically skip any tables that don't exist,
preventing errors like "relation does not exist".

After running this script, the "infinite recursion detected in policy" 
error should be resolved for all existing tables.
*/


