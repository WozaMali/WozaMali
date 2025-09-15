-- Check what tables actually exist in the database
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name LIKE '%collect%'
ORDER BY table_name;

-- Check columns in collections table if it exists
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name LIKE '%collect%'
ORDER BY table_name, ordinal_position;

-- Check if unified_collections table exists and its structure
SELECT 'unified_collections exists:' as check,
       EXISTS (
           SELECT 1 FROM information_schema.tables
           WHERE table_schema = 'public'
           AND table_name = 'unified_collections'
       ) as exists_flag;

-- Check foreign key relationships
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND (tc.table_name LIKE '%collect%' OR ccu.table_name LIKE '%collect%')
ORDER BY tc.table_name, tc.constraint_name;
