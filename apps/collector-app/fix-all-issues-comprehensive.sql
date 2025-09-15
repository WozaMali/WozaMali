-- ============================================================================
-- COMPREHENSIVE FIX FOR ALL CURRENT ISSUES
-- ============================================================================
-- This script fixes:
-- 1. valid_collector_id constraint violation for dumisani@wozamali.co.za
-- 2. Database relationship issues between profiles and addresses
-- 3. Creates necessary views for the frontend
-- 4. Fixes pickups table structure (missing total_kg column)

-- ============================================================================
-- STEP 1: FIX DUMISANI COLLECTOR PROFILE
-- ============================================================================

-- First, let's examine the current constraint
SELECT 
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_collector_id';

-- Check the current user's profile structure
SELECT 
    id,
    email,
    role,
    collector_id,
    is_active,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'dumisani@wozamali.co.za';

-- Fix the constraint issue by updating the user with a valid collector_id
UPDATE profiles 
SET 
    role = 'collector',
    collector_id = id, -- Use the user's own ID as collector_id
    updated_at = NOW()
WHERE email = 'dumisani@wozamali.co.za';

-- Verify the update worked
SELECT 
    id,
    email,
    role,
    collector_id,
    is_active,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'dumisani@wozamali.co.za';

-- ============================================================================
-- STEP 2: FIX DATABASE RELATIONSHIPS
-- ============================================================================

-- Check the current table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('profiles', 'addresses')
ORDER BY table_name, ordinal_position;

-- Check existing foreign key relationships
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

-- Ensure the addresses table has the correct structure
-- Add profile_id column if it doesn't exist
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

-- Create the foreign key relationship if it doesn't exist
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

-- ============================================================================
-- STEP 3: FIX PICKUPS TABLE STRUCTURE
-- ============================================================================

-- Check the current pickups table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickups'
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$
BEGIN
    -- Add total_kg column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pickups' AND column_name = 'total_kg'
    ) THEN
        ALTER TABLE pickups ADD COLUMN total_kg DECIMAL(10,3) DEFAULT 0;
        RAISE NOTICE 'Added total_kg column to pickups table';
    ELSE
        RAISE NOTICE 'total_kg column already exists in pickups table';
    END IF;

    -- Add total_value column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pickups' AND column_name = 'total_value'
    ) THEN
        ALTER TABLE pickups ADD COLUMN total_value DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Added total_value column to pickups table';
    ELSE
        RAISE NOTICE 'total_value column already exists in pickups table';
    END IF;

    -- Add created_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pickups' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE pickups ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added created_at column to pickups table';
    ELSE
        RAISE NOTICE 'created_at column already exists in pickups table';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pickups' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE pickups ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to pickups table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in pickups table';
    END IF;
END $$;

-- Create a function to update pickup totals automatically
CREATE OR REPLACE FUNCTION update_pickup_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update pickup totals when pickup_items change
    UPDATE pickups 
    SET 
        total_kg = (
            SELECT COALESCE(SUM(kilograms), 0) 
            FROM pickup_items 
            WHERE pickup_id = COALESCE(NEW.pickup_id, OLD.pickup_id)
        ),
        total_value = (
            SELECT COALESCE(SUM(pi.kilograms * m.rate_per_kg), 0)
            FROM pickup_items pi
            JOIN materials m ON pi.material_id = m.id
            WHERE pi.pickup_id = COALESCE(NEW.pickup_id, OLD.pickup_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.pickup_id, OLD.pickup_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update totals
DO $$
BEGIN
    -- Drop existing triggers if they exist
    DROP TRIGGER IF EXISTS trigger_update_pickup_totals_insert ON pickup_items;
    DROP TRIGGER IF EXISTS trigger_update_pickup_totals_update ON pickup_items;
    DROP TRIGGER IF EXISTS trigger_update_pickup_totals_delete ON pickup_items;

    -- Create new triggers
    CREATE TRIGGER trigger_update_pickup_totals_insert
        AFTER INSERT ON pickup_items
        FOR EACH ROW
        EXECUTE FUNCTION update_pickup_totals();

    CREATE TRIGGER trigger_update_pickup_totals_update
        AFTER UPDATE ON pickup_items
        FOR EACH ROW
        EXECUTE FUNCTION update_pickup_totals();

    CREATE TRIGGER trigger_update_pickup_totals_delete
        AFTER DELETE ON pickup_items
        FOR EACH ROW
        EXECUTE FUNCTION update_pickup_totals();

    RAISE NOTICE 'Created triggers for automatic pickup totals updates';
END $$;

-- ============================================================================
-- STEP 4: CREATE NECESSARY VIEWS
-- ============================================================================

-- 4. Create the customer_profiles_with_addresses_view
DROP VIEW IF EXISTS customer_profiles_with_addresses_view;

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
WHERE p.role = 'member' AND p.is_active = true
GROUP BY p.id, p.email, p.full_name, p.phone, p.role, p.is_active, p.created_at, p.updated_at;

-- Grant permissions on the view
GRANT SELECT ON customer_profiles_with_addresses_view TO authenticated;

-- ============================================================================
-- STEP 5: VERIFICATION AND TESTING
-- ============================================================================

-- Verify the relationship works
SELECT 
    p.id,
    p.email,
    p.role,
    COUNT(a.id) as address_count
FROM profiles p
LEFT JOIN addresses a ON p.id = a.profile_id
WHERE p.role = 'member'
GROUP BY p.id, p.email, p.role
ORDER BY p.created_at DESC
LIMIT 5;

-- Test the view
SELECT 
    id,
    email,
    full_name,
    role,
    jsonb_array_length(addresses::jsonb) as address_count
FROM customer_profiles_with_addresses_view
LIMIT 3;

-- Check all collector profiles to see the pattern
SELECT 
    id,
    email,
    role,
    collector_id,
    is_active
FROM profiles 
WHERE role = 'collector'
ORDER BY created_at DESC;

-- Verify pickups table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickups'
ORDER BY ordinal_position;

-- ============================================================================
-- STEP 6: CREATE SAMPLE DATA FOR TESTING (OPTIONAL)
-- ============================================================================

-- Insert a sample address for testing if none exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM addresses LIMIT 1) THEN
        -- Check if we have any customer profiles first
        IF EXISTS (SELECT 1 FROM profiles WHERE role = 'member' LIMIT 1) THEN
            -- Get a customer profile to attach the address to
            INSERT INTO addresses (profile_id, line1, suburb, city, postal_code, is_primary)
            SELECT 
                p.id,
                '123 Test Street',
                'Test Suburb',
                'Test City',
                '1234',
                true
            FROM profiles p
            WHERE p.role = 'member'
            LIMIT 1;
            
            RAISE NOTICE 'Created sample address for testing';
        ELSE
            RAISE NOTICE 'No customer profiles found, skipping sample address creation';
        END IF;
    ELSE
        RAISE NOTICE 'Addresses already exist, skipping sample data creation';
    END IF;
END $$;

-- Insert a sample pickup for testing if none exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pickups LIMIT 1) THEN
        -- Check if we have the required data first
        IF EXISTS (SELECT 1 FROM profiles WHERE role = 'member' LIMIT 1) 
           AND EXISTS (SELECT 1 FROM profiles WHERE role = 'collector' LIMIT 1)
           AND EXISTS (SELECT 1 FROM addresses LIMIT 1) THEN
            
            -- Insert a sample pickup for testing
            INSERT INTO pickups (
                customer_id, 
                collector_id, 
                address_id, 
                status, 
                total_kg, 
                total_value
            ) VALUES (
                (SELECT id FROM profiles WHERE role = 'member' LIMIT 1),
                (SELECT id FROM profiles WHERE role = 'collector' LIMIT 1),
                (SELECT id FROM addresses LIMIT 1),
                'submitted',
                0,
                0
            );
            RAISE NOTICE 'Created sample pickup for testing';
        ELSE
            RAISE NOTICE 'Missing required data (customer profiles, collector profiles, or addresses), skipping sample pickup creation';
        END IF;
    ELSE
        RAISE NOTICE 'Pickups already exist, skipping sample data creation';
    END IF;
END $$;

-- Final verification
SELECT 
    'PROFILES' as table_name,
    COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 
    'ADDRESSES' as table_name,
    COUNT(*) as record_count
FROM addresses
UNION ALL
SELECT 
    'COLLECTOR PROFILES' as table_name,
    COUNT(*) as record_count
FROM profiles
WHERE role = 'collector'
UNION ALL
SELECT 
    'PICKUPS' as table_name,
    COUNT(*) as record_count
FROM pickups
UNION ALL
SELECT 
    'PICKUP_ITEMS' as table_name,
    COUNT(*) as record_count
FROM pickup_items
UNION ALL
SELECT 
    'MATERIALS' as table_name,
    COUNT(*) as record_count
FROM materials;
