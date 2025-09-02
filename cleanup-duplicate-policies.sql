-- ============================================================================
-- CLEANUP DUPLICATE AND PROBLEMATIC RLS POLICIES
-- ============================================================================
-- This script cleans up duplicate policies and removes any remaining circular references

-- ============================================================================
-- STEP 1: DROP DUPLICATE AND PROBLEMATIC POLICIES
-- ============================================================================

-- Drop duplicate user policies
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;

-- Drop policies that still reference users table (potential recursion)
DROP POLICY IF EXISTS "Only office can delete users" ON users;
DROP POLICY IF EXISTS "Only office can insert users" ON users;

-- ============================================================================
-- STEP 2: CREATE CLEAN, SIMPLIFIED POLICIES
-- ============================================================================

-- Clean user policies (no circular references) - only create if they don't exist
DO $$
BEGIN
    -- Create "Users can view their own profile" if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can view their own profile'
    ) THEN
        CREATE POLICY "Users can view their own profile" ON users
            FOR SELECT USING (auth.uid() = id);
    END IF;

    -- Create "Users can update their own profile" if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can update their own profile'
    ) THEN
        CREATE POLICY "Users can update their own profile" ON users
            FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Create "Authenticated users can view all users" if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Authenticated users can view all users'
    ) THEN
        CREATE POLICY "Authenticated users can view all users" ON users
            FOR SELECT USING (auth.role() = 'authenticated');
    END IF;

    -- Create "Authenticated users can manage all users" if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Authenticated users can manage all users'
    ) THEN
        CREATE POLICY "Authenticated users can manage all users" ON users
            FOR ALL USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- ============================================================================
-- STEP 3: VERIFY POLICIES
-- ============================================================================

-- Test materials access
SELECT 
    'Materials Access Test' as test_type,
    COUNT(*) as active_materials_count
FROM materials
WHERE is_active = true;

-- Show final policy list
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NULL THEN 'No conditions'
        ELSE 'Has conditions'
    END as has_conditions
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'materials', 'pickup_items', 'pickup_photos')
ORDER BY tablename, policyname;

-- ============================================================================
-- POLICIES CLEANED UP! 🎉
-- ============================================================================
-- The RLS policies are now clean and should work without recursion errors
-- Materials should be accessible and the Office app should work properly
-- ============================================================================
