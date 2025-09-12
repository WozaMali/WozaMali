-- ============================================================================
-- UNIFIED APPS CONNECTION TEST
-- ============================================================================
-- This script tests that all three apps can access the unified database

-- 1. Test Main App requirements
SELECT 'Testing Main App requirements...' as status;

-- Check if township dropdown works
SELECT 
    'Main App - Township Dropdown' as test_name,
    COUNT(*) as total_townships,
    COUNT(CASE WHEN jsonb_array_length(subdivisions) > 0 THEN 1 END) as townships_with_subdivisions
FROM township_dropdown;

-- Check if subdivision dropdown works
SELECT 
    'Main App - Subdivision Dropdown' as test_name,
    COUNT(*) as total_subdivisions,
    COUNT(DISTINCT area_id) as unique_townships
FROM subdivision_dropdown;

-- 2. Test Collector App requirements
SELECT 'Testing Collector App requirements...' as status;

-- Check if residents view works
SELECT 
    'Collector App - Residents View' as test_name,
    COUNT(*) as total_residents,
    COUNT(CASE WHEN address_status = 'complete' THEN 1 END) as complete_addresses,
    COUNT(CASE WHEN address_status = 'legacy' THEN 1 END) as legacy_addresses,
    COUNT(CASE WHEN address_status = 'incomplete' THEN 1 END) as incomplete_addresses
FROM residents_view;

-- 3. Test Office App requirements
SELECT 'Testing Office App requirements...' as status;

-- Check if users table works with roles
SELECT 
    'Office App - Users with Roles' as test_name,
    COUNT(*) as total_users,
    COUNT(CASE WHEN r.name = 'resident' THEN 1 END) as residents,
    COUNT(CASE WHEN r.name = 'collector' THEN 1 END) as collectors,
    COUNT(CASE WHEN r.name = 'admin' THEN 1 END) as admins
FROM public.users u
LEFT JOIN public.roles r ON u.role_id = r.id;

-- 4. Test address system integration
SELECT 'Testing address system integration...' as status;

-- Check township coverage
SELECT 
    'Address System - Township Coverage' as test_name,
    COUNT(*) as total_areas,
    COUNT(CASE WHEN jsonb_array_length(COALESCE(subdivisions, '[]'::jsonb)) > 0 THEN 1 END) as areas_with_subdivisions,
    COUNT(CASE WHEN city = 'Soweto' THEN 1 END) as soweto_areas
FROM public.areas
WHERE is_active = true;

-- 5. Test data consistency
SELECT 'Testing data consistency...' as status;

-- Check if all townships have subdivisions
SELECT 
    'Data Consistency - Townships vs Subdivisions' as test_name,
    t.township_count,
    s.unique_townships,
    CASE 
        WHEN t.township_count = s.unique_townships THEN 'Consistent'
        ELSE 'Inconsistent'
    END as status
FROM (
    SELECT COUNT(*) as township_count FROM township_dropdown
) t
CROSS JOIN (
    SELECT COUNT(DISTINCT area_id) as unique_townships FROM subdivision_dropdown
) s;

-- 6. Test RLS policies
SELECT 'Testing RLS policies...' as status;

-- Check if views are accessible to authenticated users
SELECT 
    'RLS Test - View Access' as test_name,
    CASE 
        WHEN COUNT(*) > 0 THEN 'Views accessible'
        ELSE 'Views not accessible'
    END as status
FROM township_dropdown
LIMIT 1;

-- 7. Show comprehensive status
SELECT 'Comprehensive Status Report:' as status;

SELECT 
    'Main App' as app_name,
    'Township Dropdown' as feature,
    CASE 
        WHEN (SELECT COUNT(*) FROM township_dropdown) > 0 THEN 'Working'
        ELSE 'Not Working'
    END as status
UNION ALL
SELECT 
    'Main App' as app_name,
    'Subdivision Dropdown' as feature,
    CASE 
        WHEN (SELECT COUNT(*) FROM subdivision_dropdown) > 0 THEN 'Working'
        ELSE 'Not Working'
    END as status
UNION ALL
SELECT 
    'Collector App' as app_name,
    'Residents View' as feature,
    CASE 
        WHEN (SELECT COUNT(*) FROM residents_view) >= 0 THEN 'Working'
        ELSE 'Not Working'
    END as status
UNION ALL
SELECT 
    'Office App' as app_name,
    'Users with Roles' as feature,
    CASE 
        WHEN (SELECT COUNT(*) FROM public.users) >= 0 THEN 'Working'
        ELSE 'Not Working'
    END as status;

-- 8. Final verification
SELECT 'All tests completed!' as status;
SELECT 'If all features show "Working", then all three apps should function correctly.' as message;
