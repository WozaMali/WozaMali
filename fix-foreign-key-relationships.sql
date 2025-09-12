-- Fix Foreign Key Relationships
-- This script fixes the relationship between users and areas tables

-- Step 1: Check if township_id column exists in users table
DO $$
BEGIN
    -- Check if township_id column exists in users table
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'township_id'
    ) THEN
        -- Add township_id column to users table
        ALTER TABLE users ADD COLUMN township_id UUID;
        RAISE NOTICE 'Added township_id column to users table';
    ELSE
        RAISE NOTICE 'township_id column already exists in users table';
    END IF;
END $$;

-- Step 2: Check if areas table exists and has proper structure
DO $$
BEGIN
    -- Check if areas table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'areas'
    ) THEN
        -- Create areas table if it doesn't exist
        CREATE TABLE areas (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created areas table';
    ELSE
        RAISE NOTICE 'areas table already exists';
    END IF;
END $$;

-- Step 3: Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    -- Check if foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_users_township_id' 
        AND table_name = 'users'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE users 
        ADD CONSTRAINT fk_users_township_id 
        FOREIGN KEY (township_id) REFERENCES areas(id);
        RAISE NOTICE 'Added foreign key constraint fk_users_township_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint fk_users_township_id already exists';
    END IF;
END $$;

-- Step 4: Insert sample areas data if table is empty
DO $$
BEGIN
    -- Check if areas table is empty
    IF NOT EXISTS (SELECT 1 FROM areas LIMIT 1) THEN
        -- Insert sample areas
        INSERT INTO areas (id, name) VALUES 
        ('550e8400-e29b-41d4-a716-446655440001', 'Soweto'),
        ('550e8400-e29b-41d4-a716-446655440002', 'Johannesburg'),
        ('550e8400-e29b-41d4-a716-446655440003', 'Pretoria'),
        ('550e8400-e29b-41d4-a716-446655440004', 'Cape Town'),
        ('550e8400-e29b-41d4-a716-446655440005', 'Durban');
        RAISE NOTICE 'Inserted sample areas data';
    ELSE
        RAISE NOTICE 'Areas table already has data';
    END IF;
END $$;

-- Step 5: Update users with sample township_id if they don't have one
DO $$
BEGIN
    -- Update users without township_id to have a default township
    UPDATE users 
    SET township_id = '550e8400-e29b-41d4-a716-446655440001' -- Soweto
    WHERE township_id IS NULL;
    
    -- Check how many users were updated
    IF FOUND THEN
        RAISE NOTICE 'Updated users with default township_id';
    ELSE
        RAISE NOTICE 'No users needed township_id update';
    END IF;
END $$;

-- Step 6: Test the relationship
SELECT 
    'Testing foreign key relationship' as test_type,
    COUNT(*) as total_users,
    COUNT(township_id) as users_with_township,
    COUNT(DISTINCT township_id) as unique_townships
FROM users;

-- Step 7: Test the join query that was failing
SELECT 
    'Testing join query' as test_type,
    COUNT(*) as result_count
FROM users u
LEFT JOIN areas a ON u.township_id = a.id;

-- Step 8: Show sample data
SELECT 
    'Sample data' as test_type,
    u.id,
    u.first_name,
    u.last_name,
    u.township_id,
    a.name as township_name
FROM users u
LEFT JOIN areas a ON u.township_id = a.id
LIMIT 5;

-- Final status
SELECT 'Foreign key relationships fixed successfully!' as final_status;
