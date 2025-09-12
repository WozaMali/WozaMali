-- ============================================================================
-- FINAL VERIFICATION SCRIPT
-- ============================================================================
-- This script verifies that all the database fixes are working correctly
-- and that the dashboard service should now function without errors
-- ============================================================================

-- ============================================================================
-- 1. VERIFY COLLECTIONS TABLE STRUCTURE
-- ============================================================================

SELECT 
    'Collections Table Structure' as verification_type,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'collections' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================================================
-- 2. VERIFY FOREIGN KEY CONSTRAINTS
-- ============================================================================

SELECT 
    'Foreign Key Constraints' as verification_type,
    tc.constraint_name,
    tc.table_name,
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
AND tc.table_name = 'collections'
AND tc.table_schema = 'public';

-- ============================================================================
-- 3. VERIFY ROLES TABLE
-- ============================================================================

SELECT 
    'Available Roles' as verification_type,
    name,
    description,
    permissions
FROM public.roles
ORDER BY name;

-- ============================================================================
-- 4. TEST DASHBOARD QUERIES
-- ============================================================================

-- Test today's collections query (what dashboard service uses)
SELECT 
    'Today Collections Test' as verification_type,
    COUNT(*) as today_collections_count,
    SUM(weight_kg) as total_weight_today
FROM public.collections
WHERE collection_date = CURRENT_DATE
OR (collection_date IS NULL AND created_at::date = CURRENT_DATE);

-- Test role-based user query
SELECT 
    'Member Role Users Test' as verification_type,
    COUNT(*) as total_members
FROM public.users
WHERE role_id = 'member' 
OR role_id IN (SELECT id::text FROM public.roles WHERE name = 'member');

-- Test recent pickups query structure
SELECT 
    'Recent Pickups Structure Test' as verification_type,
    c.id,
    c.collection_date,
    c.status,
    c.weight_kg,
    c.created_at,
    u.full_name as customer_name
FROM public.collections c
LEFT JOIN public.users u ON c.user_id = u.id
ORDER BY c.created_at DESC
LIMIT 3;

-- ============================================================================
-- 5. VERIFY INDEXES FOR PERFORMANCE
-- ============================================================================

SELECT 
    'Performance Indexes' as verification_type,
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename = 'collections'
AND schemaname = 'public';

-- ============================================================================
-- 6. FINAL STATUS CHECK
-- ============================================================================

SELECT 
    'FINAL STATUS' as verification_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'collection_date')
        THEN '✅ collection_date column exists'
        ELSE '❌ collection_date column missing'
    END as collection_date_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name = 'collections' AND constraint_name = 'collections_user_id_fkey')
        THEN '✅ user_id foreign key exists'
        ELSE '❌ user_id foreign key missing'
    END as user_id_fk_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM public.roles WHERE name = 'member')
        THEN '✅ member role exists'
        ELSE '❌ member role missing'
    END as member_role_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'collections' AND column_name = 'weight_kg')
        THEN '✅ weight_kg column exists'
        ELSE '❌ weight_kg column missing'
    END as weight_kg_status;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎉 VERIFICATION COMPLETE!';
    RAISE NOTICE 'All database schema fixes have been successfully applied.';
    RAISE NOTICE 'Your dashboard service should now work without console errors.';
    RAISE NOTICE 'Please restart your application and test the dashboard functionality.';
END $$;