-- ============================================================================
-- FIX USER NAMES DATA
-- ============================================================================
-- This script will populate first_name and last_name fields from full_name
-- for users where these fields are currently null

-- 1. First, let's see what users need fixing
SELECT 
    'Users needing name fix' as info,
    id,
    email,
    first_name,
    last_name,
    full_name,
    CASE 
        WHEN first_name IS NULL AND last_name IS NULL AND full_name IS NOT NULL THEN 'NEEDS_FIX'
        ELSE 'OK'
    END as status
FROM public.users 
WHERE first_name IS NULL AND last_name IS NULL AND full_name IS NOT NULL
ORDER BY created_at DESC;

-- 2. Update users where first_name and last_name are null but full_name exists
-- For single word names (like "legacymusicsa"), we'll use it as first_name
-- For multi-word names, we'll split them appropriately

UPDATE public.users 
SET 
    first_name = CASE 
        -- If full_name has spaces, split into first and last
        WHEN position(' ' in full_name) > 0 THEN 
            split_part(full_name, ' ', 1)
        -- If no spaces, use the whole name as first_name
        ELSE full_name
    END,
    last_name = CASE 
        -- If full_name has spaces, use everything after first space as last_name
        WHEN position(' ' in full_name) > 0 THEN 
            substring(full_name from position(' ' in full_name) + 1)
        -- If no spaces, leave last_name as null or use a default
        ELSE NULL
    END,
    updated_at = NOW()
WHERE first_name IS NULL 
AND last_name IS NULL 
AND full_name IS NOT NULL
AND full_name != '';

-- 3. Verify the updates
SELECT 
    'Updated users' as info,
    id,
    email,
    first_name,
    last_name,
    full_name,
    updated_at
FROM public.users 
WHERE email = 'legacymusicsa@gmail.com'
OR (first_name IS NOT NULL AND last_name IS NOT NULL)
ORDER BY updated_at DESC
LIMIT 10;

-- 4. Show summary of the fix
SELECT 
    'Fix Summary' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as users_with_first_name,
    COUNT(CASE WHEN last_name IS NOT NULL THEN 1 END) as users_with_last_name,
    COUNT(CASE WHEN first_name IS NOT NULL AND last_name IS NOT NULL THEN 1 END) as users_with_both_names
FROM public.users;
