-- Find Mmabatho Motseki user details
SELECT 
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
WHERE email = 'motsekimmabatho92@gmail.com' 
   OR id = 'b0938bb2-4c9d-4048-bd0c-811fd2844528';

-- Also check what role they have (with proper type casting)
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.full_name,
    u.role_id,
    r.name as role_name,
    r.description as role_description
FROM public.users u
LEFT JOIN public.roles r ON u.role_id::text = r.id::text
WHERE u.email = 'motsekimmabatho92@gmail.com' 
   OR u.id = 'b0938bb2-4c9d-4048-bd0c-811fd2844528';
