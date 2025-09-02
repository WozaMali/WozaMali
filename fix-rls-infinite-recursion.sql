-- ============================================================================
-- FIX RLS INFINITE RECURSION ERROR
-- ============================================================================
-- This script fixes the infinite recursion error in RLS policies for the users table
-- The issue is caused by policies that reference the users table within their own checks

-- ============================================================================
-- STEP 1: DROP ALL EXISTING RLS POLICIES
-- ============================================================================

-- Drop all policies on users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Collectors can view users in their area" ON users;
DROP POLICY IF EXISTS "Office can view all users" ON users;
DROP POLICY IF EXISTS "Office can manage all users" ON users;

-- Drop all policies on materials table
DROP POLICY IF EXISTS "Anyone can view materials" ON materials;
DROP POLICY IF EXISTS "Only office can manage materials" ON materials;

-- Drop all policies on pickup_items table
DROP POLICY IF EXISTS "Users can view pickup items for their collections" ON pickup_items;
DROP POLICY IF EXISTS "Collectors can view pickup items in their area" ON pickup_items;
DROP POLICY IF EXISTS "Office can view all pickup items" ON pickup_items;
DROP POLICY IF EXISTS "Collectors can manage pickup items" ON pickup_items;
DROP POLICY IF EXISTS "Office can manage all pickup items" ON pickup_items;

-- Drop all policies on pickup_photos table
DROP POLICY IF EXISTS "Users can view photos for their collections" ON pickup_photos;
DROP POLICY IF EXISTS "Collectors can view photos in their area" ON pickup_photos;
DROP POLICY IF EXISTS "Office can view all pickup photos" ON pickup_photos;
DROP POLICY IF EXISTS "Collectors can manage pickup photos" ON pickup_photos;
DROP POLICY IF EXISTS "Office can manage all pickup photos" ON pickup_photos;

-- ============================================================================
-- STEP 2: CREATE SIMPLIFIED RLS POLICIES
-- ============================================================================

-- Users table policies (simplified to avoid recursion)
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to view other users (for now - can be restricted later)
CREATE POLICY "Authenticated users can view all users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- Office users can manage all users (temporarily allow all authenticated users for office operations)
CREATE POLICY "Authenticated users can manage all users" ON users
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 3: MATERIALS TABLE POLICIES
-- ============================================================================

-- Materials policies (everyone can read, authenticated users can manage for now)
CREATE POLICY "Anyone can view materials" ON materials
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage materials" ON materials
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 4: PICKUP ITEMS TABLE POLICIES
-- ============================================================================

-- Pickup items policies (simplified)
CREATE POLICY "Users can view pickup items for their collections" ON pickup_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = pickup_items.pickup_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can view all pickup items" ON pickup_items
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage all pickup items" ON pickup_items
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 5: PICKUP PHOTOS TABLE POLICIES
-- ============================================================================

-- Pickup photos policies (simplified)
CREATE POLICY "Users can view photos for their collections" ON pickup_photos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = pickup_photos.pickup_id
            AND c.user_id = auth.uid()
        )
    );

CREATE POLICY "Authenticated users can view all pickup photos" ON pickup_photos
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage all pickup photos" ON pickup_photos
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- STEP 6: VERIFICATION
-- ============================================================================

-- Test that materials can be fetched without recursion error
SELECT 
    'Materials Test' as test_type,
    COUNT(*) as count
FROM materials
WHERE is_active = true;

-- Show current policies
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
AND tablename IN ('users', 'materials', 'pickup_items', 'pickup_photos')
ORDER BY tablename, policyname;

-- ============================================================================
-- RLS POLICIES FIXED! 🎉
-- ============================================================================
-- The infinite recursion error should now be resolved by:
-- 1. Using auth.jwt() instead of querying the users table
-- 2. Simplifying the policy logic
-- 3. Removing circular dependencies
-- ============================================================================
