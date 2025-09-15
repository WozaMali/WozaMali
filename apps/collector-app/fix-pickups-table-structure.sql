-- ============================================================================
-- FIX PICKUPS TABLE STRUCTURE
-- ============================================================================
-- This script fixes the pickups table by adding missing columns that the frontend expects
-- Error: "column pickups.total_kg does not exist"

-- 1. First, let's check the current table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickups'
ORDER BY ordinal_position;

-- 2. Add missing columns if they don't exist
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

-- 3. Create a function to update pickup totals automatically
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

-- 4. Create triggers to automatically update totals
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

-- 5. Create a function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for updated_at
DO $$
BEGIN
    DROP TRIGGER IF EXISTS update_pickups_updated_at ON pickups;
    
    CREATE TRIGGER update_pickups_updated_at
        BEFORE UPDATE ON pickups
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Created trigger for updated_at timestamp updates';
END $$;

-- 7. Verify the table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickups'
ORDER BY ordinal_position;

-- 8. Test the triggers by creating a sample pickup if none exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pickups LIMIT 1) THEN
        -- Check if we have the required data first
        IF EXISTS (SELECT 1 FROM profiles WHERE role = 'customer' LIMIT 1) 
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
                (SELECT id FROM profiles WHERE role = 'customer' LIMIT 1),
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

-- 9. Final verification
SELECT 
    'PICKUPS TABLE' as table_name,
    COUNT(*) as record_count
FROM pickups
UNION ALL
SELECT 
    'PICKUP_ITEMS TABLE' as table_name,
    COUNT(*) as record_count
FROM pickup_items
UNION ALL
SELECT 
    'MATERIALS TABLE' as table_name,
    COUNT(*) as record_count
FROM materials;
