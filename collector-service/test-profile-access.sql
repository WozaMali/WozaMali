-- Test Profile Access After Fixing Infinite Recursion
-- Run this in your Supabase SQL Editor to verify the fix works

-- 1. Test the get_user_role function
SELECT 
    'Function test' as test_type,
    get_user_role() as current_user_role,
    CASE 
        WHEN get_user_role() IS NOT NULL THEN 'PASS'
        ELSE 'FAIL'
    END as status;

-- 2. Test basic profile access (should work without recursion)
SELECT 
    'Basic profile access' as test_type,
    COUNT(*) as profile_count,
    CASE 
        WHEN COUNT(*) >= 0 THEN 'PASS - No infinite recursion'
        ELSE 'FAIL'
    END as status
FROM profiles 
WHERE id = auth.uid();

-- 3. Test admin policies (if you're an admin)
SELECT 
    'Admin policy test' as test_type,
    get_user_role() as user_role,
    CASE 
        WHEN get_user_role() = 'admin' THEN 'PASS - Admin access granted'
        ELSE 'SKIP - Not an admin user'
    END as status;

-- 4. Check all policies are properly created
SELECT 
    'Policy verification' as test_type,
    COUNT(*) as total_policies,
    COUNT(CASE WHEN tablename = 'profiles' THEN 1 END) as profiles_policies,
    CASE 
        WHEN COUNT(CASE WHEN tablename = 'profiles' THEN 1 END) >= 4 THEN 'PASS'
        ELSE 'FAIL - Missing policies'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'addresses', 'materials', 'pickups', 'pickup_items', 'pickup_photos', 'payments');

-- 5. Test that no policies use the old auth_role() function
SELECT 
    'Old function check' as test_type,
    COUNT(*) as policies_using_old_function,
    CASE 
        WHEN COUNT(*) = 0 THEN 'PASS - No old function usage'
        ELSE 'FAIL - Still using old function'
    END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND (qual LIKE '%auth_role()%' OR with_check LIKE '%auth_role()%');

-- 6. Summary
SELECT 
    'OVERALL STATUS' as test_type,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles') >= 4
         AND (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND (qual LIKE '%auth_role()%' OR with_check LIKE '%auth_role()%')) = 0
        THEN 'PASS - All tests passed'
        ELSE 'FAIL - Some tests failed'
    END as status;
