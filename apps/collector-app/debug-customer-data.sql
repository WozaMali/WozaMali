-- ============================================================================
-- DEBUG CUSTOMER DATA ISSUES
-- ============================================================================
-- This script helps debug why customers aren't appearing on the customer page

-- 1. Check if profiles table exists and has data
SELECT 
    'PROFILES TABLE' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN role = 'customer' THEN 1 END) as customer_count,
    COUNT(CASE WHEN role = 'collector' THEN 1 END) as collector_count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
FROM profiles;

-- 2. Show all customer profiles
SELECT 
    id,
    email,
    full_name,
    first_name,
    last_name,
    username,
    role,
    is_active,
    created_at
FROM profiles 
WHERE role = 'customer' 
ORDER BY created_at DESC;

-- 3. Check if addresses table exists and has data
SELECT 
    'ADDRESSES TABLE' as table_name,
    COUNT(*) as total_records
FROM addresses;

-- 4. Show all addresses with profile information
SELECT 
    a.id,
    a.profile_id,
    a.line1,
    a.suburb,
    a.city,
    a.is_primary,
    p.email,
    p.full_name,
    p.role
FROM addresses a
LEFT JOIN profiles p ON a.profile_id = p.id
ORDER BY a.created_at DESC;

-- 5. Check the customer_profiles_with_addresses_view
SELECT 
    'VIEW TEST' as test_type,
    COUNT(*) as view_record_count
FROM customer_profiles_with_addresses_view;

-- 6. Test the view with sample data
SELECT 
    id,
    email,
    full_name,
    role,
    jsonb_array_length(addresses::jsonb) as address_count
FROM customer_profiles_with_addresses_view
LIMIT 5;

-- 7. Check if there are any customer profiles without addresses
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    COUNT(a.id) as address_count
FROM profiles p
LEFT JOIN addresses a ON p.id = a.profile_id
WHERE p.role = 'member' AND p.is_active = true
GROUP BY p.id, p.email, p.full_name, p.role
HAVING COUNT(a.id) = 0;

-- 8. Check RLS policies on profiles table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 9. Check RLS policies on addresses table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'addresses';

-- 10. Test direct query to see what's accessible
SELECT 
    'DIRECT QUERY TEST' as test_type,
    COUNT(*) as accessible_profiles
FROM profiles 
WHERE role = 'member' AND is_active = true;

-- 11. Check if the view has proper permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'customer_profiles_with_addresses_view';

-- 12. Show any recent errors or issues
SELECT 
    'CURRENT USER' as info_type,
    current_user as current_user,
    session_user as session_user,
    current_database() as current_database;
