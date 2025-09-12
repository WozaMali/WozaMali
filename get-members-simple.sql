-- Simple query to get all members with their full information
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.full_name,
    u.phone,
    u.role_id,
    r.name as role_name,
    u.status,
    u.created_at,
    u.updated_at,
    
    -- Smart display name
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
ORDER BY u.created_at DESC;
