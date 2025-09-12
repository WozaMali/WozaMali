-- Test Main App Access After RLS Fix
-- Run this to verify the main app can access the required data

-- 1. Test profile access
SELECT 
    'Profile Access Test' as test_name,
    COUNT(*) as total_profiles,
    'Should show user profiles' as expected
FROM public.profiles;

-- 2. Test wallet access
SELECT 
    'Wallet Access Test' as test_name,
    COUNT(*) as total_wallets,
    'Should show wallet data' as expected
FROM public.wallets;

-- 3. Test collection/pickup access
SELECT 
    'Collection Access Test' as test_name,
    COUNT(*) as total_collections,
    'Should show collection data' as expected
FROM public.collections;

-- 4. Test pickup access (using the view)
SELECT 
    'Pickup Access Test' as test_name,
    COUNT(*) as total_pickups,
    'Should show pickup data' as expected
FROM public.pickups;

-- 5. Test material access
SELECT 
    'Material Access Test' as test_name,
    COUNT(*) as total_materials,
    'Should show material data' as expected
FROM public.materials;

-- 6. Test specific user data (if any exists)
SELECT 
    'User Data Test' as test_name,
    p.full_name,
    w.balance,
    w.total_points,
    w.tier
FROM public.profiles p
LEFT JOIN public.wallets w ON p.id = w.user_id
LIMIT 5;

-- 7. Test collection data for a user
SELECT 
    'Collection Data Test' as test_name,
    c.id as collection_id,
    c.material_type,
    c.weight_kg,
    c.status,
    c.created_at
FROM public.collections c
LIMIT 5;

-- 8. Final verification
SELECT 
    '🎯 ALL TESTS COMPLETE' as status,
    'If you see data above, the main app should work' as result,
    'Check your main app dashboard now' as next_step;
