-- WozaMoney Role Constraint Fix
-- Run this to fix the role column constraint issue

-- 1. First, let's see what the current role constraint looks like
SELECT 
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'profiles'
  AND tc.constraint_type = 'CHECK'
  AND cc.check_clause LIKE '%role%';

-- 2. Drop the problematic role constraint if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND constraint_name = 'profiles_role_check'
    ) THEN
        ALTER TABLE public.profiles DROP CONSTRAINT profiles_role_check;
        RAISE NOTICE 'Dropped profiles_role_check constraint';
    ELSE
        RAISE NOTICE 'profiles_role_check constraint does not exist';
    END IF;
END $$;

-- 3. Create a new, more flexible role constraint
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manager', 'user', 'member', 'recycler', 'collector'));

-- 4. Update any existing profiles with invalid roles to use 'member'
UPDATE public.profiles 
SET role = 'member' 
WHERE role IS NULL OR role NOT IN ('admin', 'manager', 'user', 'member', 'recycler', 'collector');

-- 5. Set a default value for the role column
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'member';

-- 6. Verify the fix
SELECT 
    'Role constraint fixed' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as profiles_with_role,
    COUNT(CASE WHEN role IS NULL THEN 1 END) as profiles_without_role
FROM public.profiles;

-- 7. Show current role distribution
SELECT 
    role,
    COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY count DESC;
