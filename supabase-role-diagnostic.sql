-- WozaMoney Role Column Diagnostic Script
-- Run this first to see what role values are allowed

-- 1. Check the role column definition and constraints
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles' 
  AND column_name = 'role';

-- 2. Check for check constraints on the role column
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
  AND tc.table_name = 'profiles'
  AND tc.constraint_type = 'CHECK'
  AND cc.check_clause LIKE '%role%';

-- 3. Check if role is an enum type
SELECT 
    t.typname as type_name,
    e.enumlabel as enum_value,
    e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN (
    SELECT udt_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'profiles' 
      AND column_name = 'role'
);

-- 4. Check existing role values in profiles table
SELECT 
    role,
    COUNT(*) as count
FROM public.profiles 
WHERE role IS NOT NULL
GROUP BY role
ORDER BY count DESC;

-- 5. Check if there are any profiles without roles
SELECT 
    COUNT(*) as profiles_without_role
FROM public.profiles 
WHERE role IS NULL;

-- 6. Show sample profile data to understand the structure
SELECT 
    id,
    email,
    role,
    is_active,
    status,
    created_at
FROM public.profiles 
LIMIT 5;
