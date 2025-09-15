-- Check the actual structure of collection_pickups table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'collection_pickups'
ORDER BY ordinal_position;

-- Check if collection_pickups has collection_code or pickup_code
SELECT
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'collection_pickups'
    AND column_name LIKE '%code%'
ORDER BY column_name;

-- Check collections table structure for comparison
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'collections'
ORDER BY ordinal_position;

-- Check which table has collection_code
SELECT
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
    AND column_name = 'collection_code'
ORDER BY table_name;
