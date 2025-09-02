-- ============================================================================
-- MIGRATE EXISTING ADDRESSES TO UNIFIED USER_ADDRESSES TABLE
-- ============================================================================
-- This script migrates existing address data from user_metadata and profiles
-- to the unified user_addresses table for all apps to use

-- ============================================================================
-- STEP 0: ENSURE USERS EXIST IN UNIFIED USERS TABLE
-- ============================================================================

-- Create users in unified users table for any auth.users that don't exist there yet
INSERT INTO users (
    id,
    name,
    phone,
    role,
    email,
    created_at,
    updated_at
)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Unknown User') as name,
    au.raw_user_meta_data->>'phone' as phone,
    'resident' as role,  -- Default role, can be updated later
    au.email,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL  -- Only insert users that don't exist in unified users table
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 1: MIGRATE FROM USER METADATA (AUTH.USERS)
-- ============================================================================

-- Insert addresses from auth.users user_metadata (only for users that exist in unified users table)
INSERT INTO user_addresses (
    user_id,
    address_type,
    address_line1,
    address_line2,
    city,
    province,
    postal_code,
    country,
    is_default,
    is_active,
    notes,
    created_at,
    updated_at
)
SELECT 
    au.id as user_id,
    'primary' as address_type,
    COALESCE(au.raw_user_meta_data->>'street_address', '') as address_line1,
    COALESCE(au.raw_user_meta_data->>'suburb', '') as address_line2,
    COALESCE(au.raw_user_meta_data->>'city', '') as city,
    COALESCE(au.raw_user_meta_data->>'province', 'Western Cape') as province,
    COALESCE(au.raw_user_meta_data->>'postal_code', '') as postal_code,
    'South Africa' as country,
    true as is_default,
    true as is_active,
    'Migrated from user metadata' as notes,
    au.created_at,
    NOW()
FROM auth.users au
INNER JOIN users u ON au.id = u.id  -- Only migrate for users that exist in unified users table
WHERE (au.raw_user_meta_data->>'street_address' IS NOT NULL 
   OR au.raw_user_meta_data->>'city' IS NOT NULL)
   AND NOT EXISTS (
     SELECT 1 FROM user_addresses ua 
     WHERE ua.user_id = au.id 
     AND ua.address_type = 'primary' 
     AND ua.is_default = true
   );

-- ============================================================================
-- STEP 2: MIGRATE FROM PROFILES TABLE (if it exists and has address columns)
-- ============================================================================

-- Check if profiles table exists and has address columns, then migrate if possible
DO $$
BEGIN
    -- Check if profiles table exists and has the required columns
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'street_address'
    ) THEN
        
        -- Insert addresses from profiles table for users who don't have addresses yet
        INSERT INTO user_addresses (
            user_id,
            address_type,
            address_line1,
            address_line2,
            city,
            province,
            postal_code,
            country,
            is_default,
            is_active,
            notes,
            created_at,
            updated_at
        )
        SELECT 
            p.id as user_id,
            'primary' as address_type,
            COALESCE(p.street_address, '') as address_line1,
            COALESCE(p.suburb, '') as address_line2,
            COALESCE(p.city, '') as city,
            COALESCE(p.province, 'Western Cape') as province,
            COALESCE(p.postal_code, '') as postal_code,
            'South Africa' as country,
            true as is_default,
            true as is_active,
            'Migrated from profiles table' as notes,
            p.created_at,
            NOW()
        FROM profiles p
        INNER JOIN users u ON p.id = u.id  -- Only migrate for users that exist in unified users table
        WHERE (p.street_address IS NOT NULL OR p.city IS NOT NULL)
          AND NOT EXISTS (
            SELECT 1 FROM user_addresses ua 
            WHERE ua.user_id = p.id 
            AND ua.address_type = 'primary' 
            AND ua.is_default = true
          );
          
        RAISE NOTICE 'Migrated addresses from profiles table';
    ELSE
        RAISE NOTICE 'Profiles table does not exist or does not have address columns - skipping profiles migration';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: CREATE PICKUP ADDRESSES
-- ============================================================================

-- Create pickup addresses (same as primary for now, can be different later)
INSERT INTO user_addresses (
    user_id,
    address_type,
    address_line1,
    address_line2,
    city,
    province,
    postal_code,
    country,
    is_default,
    is_active,
    notes,
    created_at,
    updated_at
)
SELECT 
    ua.user_id,
    'pickup' as address_type,
    ua.address_line1,
    ua.address_line2,
    ua.city,
    ua.province,
    ua.postal_code,
    ua.country,
    true as is_default,
    true as is_active,
    'Pickup address (same as primary)' as notes,
    NOW(),
    NOW()
FROM user_addresses ua
WHERE ua.address_type = 'primary' 
  AND ua.is_default = true
  AND NOT EXISTS (
    SELECT 1 FROM user_addresses ua2 
    WHERE ua2.user_id = ua.user_id 
    AND ua2.address_type = 'pickup' 
    AND ua2.is_default = true
  );

-- ============================================================================
-- STEP 4: UPDATE COLLECTIONS TO USE PICKUP ADDRESSES
-- ============================================================================

-- Update existing collections to reference pickup addresses
UPDATE collections 
SET pickup_address_id = ua.id
FROM user_addresses ua
WHERE collections.user_id = ua.user_id 
  AND ua.address_type = 'pickup' 
  AND ua.is_default = true
  AND collections.pickup_address_id IS NULL;

-- ============================================================================
-- STEP 5: VERIFICATION QUERIES
-- ============================================================================

-- Check migration results
SELECT 
    'Total user addresses created' as description,
    COUNT(*) as count
FROM user_addresses
UNION ALL
SELECT 
    'Primary addresses' as description,
    COUNT(*) as count
FROM user_addresses 
WHERE address_type = 'primary'
UNION ALL
SELECT 
    'Pickup addresses' as description,
    COUNT(*) as count
FROM user_addresses 
WHERE address_type = 'pickup'
UNION ALL
SELECT 
    'Collections with pickup addresses' as description,
    COUNT(*) as count
FROM collections 
WHERE pickup_address_id IS NOT NULL;

-- Show sample migrated addresses
SELECT 
    ua.user_id,
    ua.address_type,
    ua.address_line1,
    ua.address_line2,
    ua.city,
    ua.province,
    ua.postal_code,
    ua.is_default,
    ua.notes
FROM user_addresses ua
ORDER BY ua.created_at DESC
LIMIT 10;

-- ============================================================================
-- MIGRATION COMPLETE! 🎉
-- ============================================================================
-- All existing address data has been migrated to the unified user_addresses table
-- All apps can now fetch addresses from the same table
-- ============================================================================
