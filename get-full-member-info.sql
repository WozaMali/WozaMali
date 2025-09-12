-- Comprehensive schema to get full information about members/users
-- This query will retrieve all relevant data about users and their relationships

-- 1. Get complete user information with role details
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.full_name,
    u.phone,
    u.role_id,
    r.name as role_name,
    r.description as role_description,
    u.status as user_status,
    u.created_at as user_created_at,
    u.updated_at as user_updated_at,
    
    -- Calculate display name
    CASE 
        WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN 
            CONCAT(u.first_name, ' ', u.last_name)
        WHEN u.first_name IS NOT NULL THEN 
            u.first_name
        WHEN u.last_name IS NOT NULL THEN 
            u.last_name
        WHEN u.full_name IS NOT NULL THEN 
            u.full_name
        ELSE 
            SPLIT_PART(u.email, '@', 1)
    END as display_name,
    
    -- User type based on role
    CASE 
        WHEN r.name = 'admin' THEN 'Administrator'
        WHEN r.name = 'collector' THEN 'Collector'
        WHEN r.name = 'member' THEN 'Member/Resident'
        WHEN r.name = 'office_staff' THEN 'Office Staff'
        WHEN r.name = 'resident' THEN 'Resident'
        ELSE 'Unknown Role'
    END as user_type

FROM public.users u
LEFT JOIN public.roles r ON u.role_id::text = r.id::text
ORDER BY u.created_at DESC;

-- 2. Get member statistics
SELECT 
    'Member Statistics' as info_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN r.name = 'member' THEN 1 END) as total_members,
    COUNT(CASE WHEN r.name = 'collector' THEN 1 END) as total_collectors,
    COUNT(CASE WHEN r.name = 'admin' THEN 1 END) as total_admins,
    COUNT(CASE WHEN r.name = 'office_staff' THEN 1 END) as total_office_staff,
    COUNT(CASE WHEN u.status = 'active' THEN 1 END) as active_users,
    COUNT(CASE WHEN u.status = 'inactive' THEN 1 END) as inactive_users
FROM public.users u
LEFT JOIN public.roles r ON u.role_id::text = r.id::text;

-- 3. Get specific member information (if you want to search for a specific user)
-- Uncomment and modify the WHERE clause to search for specific users
/*
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    u.full_name,
    u.phone,
    r.name as role_name,
    u.status,
    u.created_at,
    
    -- Display name
    CASE 
        WHEN u.first_name IS NOT NULL AND u.last_name IS NOT NULL THEN 
            CONCAT(u.first_name, ' ', u.last_name)
        WHEN u.first_name IS NOT NULL THEN 
            u.first_name
        WHEN u.last_name IS NOT NULL THEN 
            u.last_name
        WHEN u.full_name IS NOT NULL THEN 
            u.full_name
        ELSE 
            SPLIT_PART(u.email, '@', 1)
    END as display_name

FROM public.users u
LEFT JOIN public.roles r ON u.role_id::text = r.id::text
WHERE u.email = 'motsekimmabatho92@gmail.com' 
   OR u.id = 'b0938bb2-4c9d-4048-bd0c-811fd2844528'
   OR u.first_name ILIKE '%mmabatho%'
   OR u.last_name ILIKE '%motseki%';
*/

-- 4. Get member collections (if they have any)
SELECT 
    'Member Collections' as info_type,
    u.id as user_id,
    u.email,
    CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, '')) as member_name,
    COUNT(c.id) as total_collections,
    SUM(c.weight_kg) as total_weight_collected,
    MAX(c.collection_date) as last_collection_date,
    MIN(c.collection_date) as first_collection_date
FROM public.users u
LEFT JOIN public.collections c ON u.id = c.user_id
WHERE r.name = 'member' OR r.name = 'resident'
GROUP BY u.id, u.email, u.first_name, u.last_name
HAVING COUNT(c.id) > 0
ORDER BY total_collections DESC;

-- 5. Get all available roles
SELECT 
    'Available Roles' as info_type,
    id,
    name,
    description,
    created_at
FROM public.roles
ORDER BY name;

RAISE NOTICE 'Full member information schema completed.';
