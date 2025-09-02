-- Debug User Role and Fix RLS Policies
-- This script will help us understand why the RLS policies are failing

-- 1. Check current authenticated user
SELECT 
    'Current Auth User' as info,
    auth.uid() as user_id,
    auth.role() as auth_role;

-- 2. Check if the current user exists in the users table
SELECT 
    'User in users table' as info,
    u.id,
    u.name,
    u.role,
    u.phone
FROM users u 
WHERE u.id = auth.uid();

-- 3. Check all users in the users table
SELECT 
    'All users in users table' as info,
    u.id,
    u.name,
    u.role,
    u.phone
FROM users u 
ORDER BY u.created_at DESC;

-- 4. Check current collections table policies
SELECT 
    'Current collections policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'collections'
    AND cmd = 'INSERT'
ORDER BY policyname;

-- 5. Drop all existing INSERT policies for collections
DROP POLICY IF EXISTS "Residents and collectors can create collections" ON collections;
DROP POLICY IF EXISTS "Collectors can create collections for any user" ON collections;

-- 6. Create a simple, reliable INSERT policy for collections
-- This policy allows any authenticated user to insert collections
CREATE POLICY "Authenticated users can create collections" ON collections
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 7. Also create a policy that allows collectors specifically
CREATE POLICY "Collectors can create collections" ON collections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'collector'
        )
    );

-- 8. Create a policy for residents
CREATE POLICY "Residents can create collections" ON collections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'resident'
        )
    );

-- 9. Verify the new policies
SELECT 
    'New collections INSERT policies' as info,
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
    AND cmd = 'INSERT'
ORDER BY policyname;

-- 10. Test if we can insert a collection (this will show us what happens)
-- Note: This might fail, but it will give us useful error information
DO $$
DECLARE
    test_user_id UUID;
    test_collection_id UUID;
BEGIN
    -- Get the current user ID
    test_user_id := auth.uid();
    
    RAISE NOTICE 'Testing collection insert for user: %', test_user_id;
    
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
