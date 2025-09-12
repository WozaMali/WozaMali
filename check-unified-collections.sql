-- Check unified_collections table structure and data

-- 1. Check table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'unified_collections' 
ORDER BY ordinal_position;

-- 2. Count records by status
SELECT 
    status,
    COUNT(*) as count
FROM unified_collections 
GROUP BY status
ORDER BY count DESC;

-- 3. Show sample data
SELECT 
    id,
    customer_id,
    customer_name,
    status,
    total_kg,
    total_value,
    total_points,
    created_at
FROM unified_collections 
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check for the specific user
SELECT 
    id,
    customer_id,
    customer_name,
    status,
    total_kg,
    total_value,
    total_points,
    created_at
FROM unified_collections 
WHERE customer_id = '6b29872e-f6d7-4be7-bb38-2104dc7491cb'
ORDER BY created_at DESC;
