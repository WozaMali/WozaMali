-- Temporary Disable RLS for Testing
-- This will help us determine if the issue is with RLS policies or with the data

-- 1. Check current RLS status
SELECT 
    'Current RLS status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'collections';

-- 2. Temporarily disable RLS on collections table
ALTER TABLE collections DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled
SELECT 
    'RLS disabled' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename = 'collections';

-- 4. Test insert without RLS
DO $$
DECLARE
    test_user_id UUID;
    test_collection_id UUID;
BEGIN
    -- Get the current user ID
    test_user_id := auth.uid();
    
    RAISE NOTICE 'Testing collection insert without RLS for user: %', test_user_id;
    
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

-- 5. Re-enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- 6. Create a very simple RLS policy
DROP POLICY IF EXISTS "Authenticated users can create collections" ON collections;
DROP POLICY IF EXISTS "Collectors can create collections" ON collections;
DROP POLICY IF EXISTS "Residents can create collections" ON collections;

-- Create the simplest possible policy
CREATE POLICY "Allow all authenticated users to insert collections" ON collections
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. Verify the simple policy
SELECT 
    'Simple RLS policy created' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'collections'
    AND cmd = 'INSERT';
