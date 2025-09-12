-- Investigate user display names issue
-- Let's check the structure and data step by step

-- 1. First, let's see the structure of the users table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check the structure of the roles table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'roles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Get a sample of users to see what data we have
SELECT 
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
LIMIT 5;

-- 4. Check what roles exist
SELECT 
    id,
    name,
    description,
    created_at
FROM public.roles
ORDER BY name;

-- 5. Try to find Mmabatho Motseki with different approaches
SELECT 
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    role_id,
    status
FROM public.users 
WHERE email ILIKE '%motseki%' 
   OR email ILIKE '%mmabatho%'
   OR first_name ILIKE '%mmabatho%'
   OR last_name ILIKE '%motseki%'
   OR full_name ILIKE '%mmabatho%'
   OR full_name ILIKE '%motseki%';

-- 6. Check if the user exists by ID
SELECT 
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    role_id,
    status
FROM public.users 
WHERE id = 'b0938bb2-4c9d-4048-bd0c-811fd2844528';

-- 7. Check if the user exists by email
SELECT 
    id,
    email,
    first_name,
    last_name,
    full_name,
    phone,
    role_id,
    status
FROM public.users 
WHERE email = 'motsekimmabatho92@gmail.com';

RAISE NOTICE 'Investigation completed for user display names issue.';
