-- Complete RLS Disable Test
-- This will help us determine if the issue is authentication or RLS

-- 1. Check current RLS status
SELECT 
    'Current RLS status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('collections', 'pickup_items');

-- 2. Completely disable RLS on both tables
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_items DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is completely disabled
SELECT 
    'RLS completely disabled' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('collections', 'pickup_items');

-- 4. Drop ALL policies to ensure nothing is interfering
DROP POLICY IF EXISTS "Allow all authenticated users to insert collections" ON collections;
DROP POLICY IF EXISTS "Allow all authenticated users to insert pickup items" ON pickup_items;
DROP POLICY IF EXISTS "Authenticated users can create collections" ON collections;
DROP POLICY IF EXISTS "Collectors can create collections" ON collections;
DROP POLICY IF EXISTS "Residents can create collections" ON collections;
DROP POLICY IF EXISTS "Residents and collectors can create collections" ON collections;
DROP POLICY IF EXISTS "Collectors can create collections for any user" ON collections;
DROP POLICY IF EXISTS "Authenticated users can insert pickup items" ON pickup_items;
DROP POLICY IF EXISTS "Collectors can insert pickup items" ON pickup_items;
DROP POLICY IF EXISTS "Collectors can manage pickup items" ON pickup_items;

-- 5. Verify no policies exist
SELECT 
    'No policies should exist' as info,
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('collections', 'pickup_items');

-- 6. Test insert without any RLS or policies
DO $$
DECLARE
    test_user_id UUID;
    test_collection_id UUID;
BEGIN
    -- Get the current user ID
    test_user_id := auth.uid();
    
    RAISE NOTICE 'Testing collection insert with NO RLS and NO policies for user: %', test_user_id;
    
    -- Try to insert a test collection
    INSERT INTO collections (
        user_id,
        collector_id,
        material_type,
        weight_kg,
        status
    ) VALUES (
        test_user_id,
        test_user_id,
        'test',
        1.0,
        'submitted'
    ) RETURNING id INTO test_collection_id;
    
    RAISE NOTICE 'Test collection inserted successfully with ID: %', test_collection_id;
    
    -- Clean up the test collection
    DELETE FROM collections WHERE id = test_collection_id;
    RAISE NOTICE 'Test collection cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Test collection insert failed: %', SQLERRM;
END $$;

-- 7. Re-enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_items ENABLE ROW LEVEL SECURITY;

-- 8. Create the simplest possible policy
CREATE POLICY "Allow everything" ON collections
    FOR ALL WITH CHECK (true);

CREATE POLICY "Allow everything" ON pickup_items
    FOR ALL WITH CHECK (true);

-- 9. Verify the new policies
SELECT 
    'New simple policies created' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename IN ('collections', 'pickup_items')
ORDER BY tablename, policyname;
