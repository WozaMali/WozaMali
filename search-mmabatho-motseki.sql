-- Search for Mmabatho Motseki across all relevant tables
-- This script will help identify who this person is and their role in the system

-- 1. Search in users table
SELECT 
    'users' as table_name,
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    role_id,
    status,
    created_at,
    updated_at
FROM public.users 
WHERE 
    LOWER(first_name) LIKE '%mmabatho%' 
    OR LOWER(last_name) LIKE '%motseki%'
    OR LOWER(full_name) LIKE '%mmabatho%'
    OR LOWER(full_name) LIKE '%motseki%'
    OR LOWER(email) LIKE '%mmabatho%'
    OR LOWER(email) LIKE '%motseki%';

-- 2. Search in collections table (if they have collections)
SELECT 
    'collections' as table_name,
    c.id,
    c.user_id,
    c.collector_id,
    c.collection_date,
    c.weight_kg,
    c.status,
    c.created_at,
    u.email as user_email,
    u.first_name as user_first_name,
    u.last_name as user_last_name,
    u.full_name as user_full_name,
    collector.email as collector_email,
    collector.first_name as collector_first_name,
    collector.last_name as collector_last_name,
    collector.full_name as collector_full_name
FROM public.collections c
LEFT JOIN public.users u ON c.user_id = u.id
LEFT JOIN public.users collector ON c.collector_id = collector.id
WHERE 
    LOWER(u.first_name) LIKE '%mmabatho%' 
    OR LOWER(u.last_name) LIKE '%motseki%'
    OR LOWER(u.full_name) LIKE '%mmabatho%'
    OR LOWER(u.full_name) LIKE '%motseki%'
    OR LOWER(u.email) LIKE '%mmabatho%'
    OR LOWER(u.email) LIKE '%motseki%'
    OR LOWER(collector.first_name) LIKE '%mmabatho%'
    OR LOWER(collector.last_name) LIKE '%motseki%'
    OR LOWER(collector.full_name) LIKE '%mmabatho%'
    OR LOWER(collector.full_name) LIKE '%motseki%'
    OR LOWER(collector.email) LIKE '%mmabatho%'
    OR LOWER(collector.email) LIKE '%motseki%';

-- 3. Search in roles table to see what roles exist
SELECT 
    'roles' as table_name,
    id,
    name,
    description,
    created_at
FROM public.roles
ORDER BY name;

-- 4. Get all users to see the complete list
SELECT 
    'all_users' as table_name,
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    role_id,
    status,
    created_at
FROM public.users 
ORDER BY created_at DESC;

-- 5. Search for any partial matches in names
SELECT 
    'partial_matches' as table_name,
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    role_id,
    status
FROM public.users 
WHERE 
    LOWER(first_name) LIKE '%maba%' 
    OR LOWER(last_name) LIKE '%motse%'
    OR LOWER(full_name) LIKE '%maba%'
    OR LOWER(full_name) LIKE '%motse%'
    OR LOWER(email) LIKE '%maba%'
    OR LOWER(email) LIKE '%motse%';

-- 6. Check if there are any similar names
SELECT 
    'similar_names' as table_name,
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    role_id,
    status
FROM public.users 
WHERE 
    LOWER(first_name) LIKE '%mm%' 
    OR LOWER(last_name) LIKE '%mo%'
    OR LOWER(full_name) LIKE '%mm%'
    OR LOWER(full_name) LIKE '%mo%';

RAISE NOTICE 'Search completed for Mmabatho Motseki across all relevant tables.';
