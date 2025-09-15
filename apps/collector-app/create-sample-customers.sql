-- ============================================================================
-- CREATE SAMPLE CUSTOMER DATA
-- ============================================================================
-- This script creates sample customer profiles and addresses
-- so they appear on the customer page

-- 1. First, let's check what we currently have
SELECT 
    'BEFORE CREATION' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'customer' THEN 1 END) as customer_count
FROM profiles;

-- 2. Create sample customer profiles
INSERT INTO profiles (
    email,
    full_name,
    first_name,
    last_name,
    username,
    role,
    is_active,
    phone
) VALUES 
    ('john.doe@example.com', 'John Doe', 'John', 'Doe', 'johndoe', 'member', true, '+27123456789'),
    ('jane.smith@example.com', 'Jane Smith', 'Jane', 'Smith', 'janesmith', 'member', true, '+27123456790'),
    ('mike.johnson@example.com', 'Mike Johnson', 'Mike', 'Johnson', 'mikejohnson', 'member', true, '+27123456791'),
    ('sarah.wilson@example.com', 'Sarah Wilson', 'Sarah', 'Wilson', 'sarahwilson', 'member', true, '+27123456792'),
    ('david.brown@example.com', 'David Brown', 'David', 'Brown', 'davidbrown', 'member', true, '+27123456793')
ON CONFLICT (email) DO NOTHING;

-- 3. Check what profiles were created
SELECT 
    'AFTER CREATION' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'customer' THEN 1 END) as customer_count
FROM profiles;

-- 4. Show the created customer profiles
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

-- 5. Create sample addresses for the customers
INSERT INTO addresses (
    profile_id,
    line1,
    suburb,
    city,
    postal_code,
    lat,
    lng,
    is_primary
) 
SELECT 
    p.id,
    CASE 
        WHEN p.email = 'john.doe@example.com' THEN '123 Main Street'
        WHEN p.email = 'jane.smith@example.com' THEN '456 Oak Avenue'
        WHEN p.email = 'mike.johnson@example.com' THEN '789 Pine Road'
        WHEN p.email = 'sarah.wilson@example.com' THEN '321 Elm Street'
        WHEN p.email = 'david.brown@example.com' THEN '654 Maple Drive'
    END,
    CASE 
        WHEN p.email = 'john.doe@example.com' THEN 'Sandton'
        WHEN p.email = 'jane.smith@example.com' THEN 'Rosebank'
        WHEN p.email = 'mike.johnson@example.com' THEN 'Melville'
        WHEN p.email = 'sarah.wilson@example.com' THEN 'Parktown'
        WHEN p.email = 'david.brown@example.com' THEN 'Bryanston'
    END,
    'Johannesburg',
    '2000',
    CASE 
        WHEN p.email = 'john.doe@example.com' THEN -26.1087
        WHEN p.email = 'jane.smith@example.com' THEN -26.1420
        WHEN p.email = 'mike.johnson@example.com' THEN -26.1841
        WHEN p.email = 'sarah.wilson@example.com' THEN -26.1841
        WHEN p.email = 'david.brown@example.com' THEN -26.0519
    END,
    CASE 
        WHEN p.email = 'john.doe@example.com' THEN 28.0567
        WHEN p.email = 'jane.smith@example.com' THEN 28.0473
        WHEN p.email = 'mike.johnson@example.com' THEN 27.9963
        WHEN p.email = 'sarah.wilson@example.com' THEN 28.0063
        WHEN p.email = 'david.brown@example.com' THEN 28.0111
    END,
    true
FROM profiles p
WHERE p.role = 'customer' 
  AND p.email IN (
    'john.doe@example.com',
    'jane.smith@example.com', 
    'mike.johnson@example.com',
    'sarah.wilson@example.com',
    'david.brown@example.com'
  )
ON CONFLICT DO NOTHING;

-- 6. Check what addresses were created
SELECT 
    'ADDRESSES CREATED' as status,
    COUNT(*) as total_addresses
FROM addresses;

-- 7. Show the created addresses with profile information
SELECT 
    a.id,
    a.profile_id,
    a.line1,
    a.suburb,
    a.city,
    a.is_primary,
    p.email,
    p.full_name
FROM addresses a
JOIN profiles p ON a.profile_id = p.id
ORDER BY a.created_at DESC;

-- 8. Test the customer_profiles_with_addresses_view
SELECT 
    'VIEW TEST' as test_type,
    COUNT(*) as view_record_count
FROM customer_profiles_with_addresses_view;

-- 9. Show sample data from the view
SELECT 
    id,
    email,
    full_name,
    role,
    jsonb_array_length(addresses::jsonb) as address_count,
    addresses
FROM customer_profiles_with_addresses_view
LIMIT 3;

-- 10. Final verification
SELECT 
    'FINAL VERIFICATION' as status,
    (SELECT COUNT(*) FROM profiles WHERE role = 'member') as member_profiles,
    (SELECT COUNT(*) FROM addresses) as total_addresses,
    (SELECT COUNT(*) FROM customer_profiles_with_addresses_view) as view_records;
