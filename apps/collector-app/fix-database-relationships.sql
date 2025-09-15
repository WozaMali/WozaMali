-- ============================================================================
-- FIX DATABASE RELATIONSHIPS
-- ============================================================================
-- This script fixes the relationship issues between profiles and addresses tables
-- that are causing the "Could not find a relationship" error

-- 1. First, let's check the current table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'addresses')
ORDER BY table_name, ordinal_position;

-- 2. Check existing foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('profiles', 'addresses');

-- 3. Check if the addresses table has the correct structure
-- The addresses table should have a profile_id column that references profiles.id
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'addresses' 
    AND column_name = 'profile_id';

-- 4. If profile_id column doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'addresses' AND column_name = 'profile_id'
    ) THEN
        ALTER TABLE addresses ADD COLUMN profile_id UUID;
        RAISE NOTICE 'Added profile_id column to addresses table';
    ELSE
        RAISE NOTICE 'profile_id column already exists in addresses table';
    END IF;
END $$;

-- 5. Create the foreign key relationship if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'addresses' 
            AND constraint_type = 'FOREIGN KEY'
            AND constraint_name LIKE '%profile_id%'
    ) THEN
        ALTER TABLE addresses 
        ADD CONSTRAINT addresses_profile_id_fkey 
        FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
        RAISE NOTICE 'Created foreign key constraint for addresses.profile_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists for addresses.profile_id';
    END IF;
END $$;

-- 6. Create a view for customer profiles with addresses
CREATE OR REPLACE VIEW customer_profiles_with_addresses_view AS
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.phone,
    p.role,
    p.is_active,
    p.created_at,
    p.updated_at,
    COALESCE(
        json_agg(
            json_build_object(
                'id', a.id,
                'line1', a.line1,
                'suburb', a.suburb,
                'city', a.city,
                'postal_code', a.postal_code,
                'lat', a.lat,
                'lng', a.lng,
                'is_primary', a.is_primary
            ) ORDER BY a.is_primary DESC, a.created_at ASC
        ) FILTER (WHERE a.id IS NOT NULL),
        '[]'::json
    ) as addresses
FROM profiles p
LEFT JOIN addresses a ON p.id = a.profile_id
WHERE p.role = 'customer' AND p.is_active = true
GROUP BY p.id, p.email, p.full_name, p.phone, p.role, p.is_active, p.created_at, p.updated_at;

-- 7. Grant permissions on the view
GRANT SELECT ON customer_profiles_with_addresses_view TO authenticated;

-- 8. Verify the relationship works
SELECT 
    p.id,
    p.email,
    p.role,
    COUNT(a.id) as address_count
FROM profiles p
LEFT JOIN addresses a ON p.id = a.profile_id
WHERE p.role = 'customer'
GROUP BY p.id, p.email, p.role
ORDER BY p.created_at DESC
LIMIT 5;

-- 9. Test the view
SELECT 
    id,
    email,
    full_name,
    role,
    jsonb_array_length(addresses::jsonb) as address_count
FROM customer_profiles_with_addresses_view
LIMIT 3;
