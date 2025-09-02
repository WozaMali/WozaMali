-- Comprehensive Debug Script
-- This will test multiple scenarios to identify the root cause

-- 1. Check current authentication status
SELECT 
    'Authentication Status' as info,
    auth.uid() as user_id,
    auth.role() as auth_role,
    auth.email() as auth_email;

-- 2. Check if the current user exists in users table
SELECT 
    'Current User in Users Table' as info,
    u.id,
    u.name,
    u.role,
    u.phone,
    u.email
FROM users u 
WHERE u.id = auth.uid();

-- 3. Check all users to see what's available
SELECT 
    'All Users' as info,
    u.id,
    u.name,
    u.role,
    u.phone,
    u.email
FROM users u 
ORDER BY u.created_at DESC;

-- 4. Check current RLS status
SELECT 
    'Current RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('collections', 'pickup_items');

-- 5. Check current policies
SELECT 
    'Current Policies' as info,
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
ORDER BY tablename, cmd, policyname;

-- 6. Test if we can query the collections table
SELECT 
    'Can Query Collections' as info,
    COUNT(*) as collection_count
FROM collections;

-- 7. Test if we can query the users table
SELECT 
    'Can Query Users' as info,
    COUNT(*) as user_count
FROM users;

-- 8. Test if we can query the user_addresses table
SELECT 
    'Can Query User Addresses' as info,
    COUNT(*) as address_count
FROM user_addresses;

-- 9. Check if there are any foreign key constraints that might be failing
SELECT 
    'Foreign Key Constraints' as info,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name IN ('collections', 'pickup_items')
ORDER BY tc.table_name, tc.constraint_name;

-- 10. Test a simple insert without any constraints
DO $$
DECLARE
    test_collection_id UUID;
BEGIN
    RAISE NOTICE 'Testing simple insert without constraints...';
    
    -- Try to insert a test collection with minimal data
    INSERT INTO collections (
        user_id,
        collector_id,
        material_type,
        weight_kg,
        status
    ) VALUES (
        '2c6824a9-8590-4787-89fd-3667d5267c8b'::UUID,
        '2c6824a9-8590-4787-89fd-3667d5267c8b'::UUID,
        'test',
        1.0,
        'submitted'
    ) RETURNING id INTO test_collection_id;
    
    RAISE NOTICE 'Simple insert successful with ID: %', test_collection_id;
    
    -- Clean up
    DELETE FROM collections WHERE id = test_collection_id;
    RAISE NOTICE 'Test collection cleaned up';
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Simple insert failed: %', SQLERRM;
END $$;
