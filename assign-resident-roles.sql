-- ============================================================================
-- ASSIGN RESIDENT ROLES TO USERS
-- ============================================================================
-- Assigns 'resident' role to all users without roles
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. CHECK CURRENT STATE
-- ============================================================================

-- Check if profiles table exists
SELECT 
    'PROFILES TABLE CHECK' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') 
        THEN 'EXISTS' 
        ELSE 'DOES NOT EXIST' 
    END as table_status;

-- Show current users without roles
SELECT 
    'USERS WITHOUT ROLES' as info,
    gu.user_id,
    gu.email,
    gu.created_at
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
WHERE p.role IS NULL
ORDER BY gu.created_at DESC;

-- ============================================================================
-- 2. CREATE PROFILES TABLE IF IT DOESN'T EXIST
-- ============================================================================

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name TEXT,
    phone TEXT,
    role TEXT DEFAULT 'resident' CHECK (role IN ('member', 'resident', 'collector', 'admin', 'office_staff')),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. INSERT PROFILES FOR USERS WITHOUT PROFILES
-- ============================================================================

-- Insert profiles for users who don't have profiles yet
INSERT INTO public.profiles (id, email, role, status, created_at, updated_at)
SELECT 
    gu.user_id,
    gu.email,
    'resident' as role,
    'active' as status,
    NOW() as created_at,
    NOW() as updated_at
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 4. UPDATE EXISTING PROFILES TO RESIDENT ROLE
-- ============================================================================

-- Update existing profiles that don't have roles to 'resident'
UPDATE public.profiles 
SET 
    role = 'resident',
    updated_at = NOW()
WHERE role IS NULL OR role = '';

-- ============================================================================
-- 5. VERIFY THE CHANGES
-- ============================================================================

-- Show updated role distribution
SELECT 
    'UPDATED ROLE DISTRIBUTION' as summary,
    COALESCE(p.role, 'No Role Assigned') as role,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
GROUP BY p.role
ORDER BY count DESC;

-- Show all users with their new roles
SELECT 
    'USERS WITH ASSIGNED ROLES' as info,
    gu.user_id,
    gu.email,
    p.full_name,
    p.role,
    p.status,
    gu.created_at,
    p.updated_at as role_assigned_at
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
ORDER BY gu.created_at DESC;

-- ============================================================================
-- 6. SUMMARY OF CHANGES
-- ============================================================================

-- Summary of role assignments
SELECT 
    'ROLE ASSIGNMENT SUMMARY' as summary,
    'Total Users' as metric,
    COUNT(*) as value
FROM get_all_users()
UNION ALL
SELECT 
    'ROLE ASSIGNMENT SUMMARY' as summary,
    'Users with Resident Role' as metric,
    COUNT(*) as value
FROM public.profiles
WHERE role = 'resident'
UNION ALL
SELECT 
    'ROLE ASSIGNMENT SUMMARY' as summary,
    'Users with Other Roles' as metric,
    COUNT(*) as value
FROM public.profiles
WHERE role != 'resident'
UNION ALL
SELECT 
    'ROLE ASSIGNMENT SUMMARY' as summary,
    'Users Still Without Roles' as metric,
    COUNT(*) as value
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
WHERE p.role IS NULL;

-- ============================================================================
-- 7. RECENT ROLE ASSIGNMENTS
-- ============================================================================

-- Show recently assigned roles
SELECT 
    'RECENT ROLE ASSIGNMENTS' as info,
    p.email,
    p.role,
    p.status,
    p.updated_at as assigned_at,
    CASE 
        WHEN p.updated_at > NOW() - INTERVAL '1 minute' THEN 'Just Assigned'
        WHEN p.updated_at > NOW() - INTERVAL '1 hour' THEN 'Assigned Recently'
        ELSE 'Assigned Earlier'
    END as assignment_time
FROM public.profiles p
WHERE p.updated_at > NOW() - INTERVAL '1 hour'
ORDER BY p.updated_at DESC;

-- ============================================================================
-- 8. FINAL VERIFICATION
-- ============================================================================

-- Final check - all users should now have resident role
SELECT 
    'FINAL VERIFICATION' as check_type,
    'Users with Resident Role' as status,
    COUNT(*) as count
FROM public.profiles
WHERE role = 'resident'
UNION ALL
SELECT 
    'FINAL VERIFICATION' as check_type,
    'Users without Roles' as status,
    COUNT(*) as count
FROM get_all_users() gu
LEFT JOIN public.profiles p ON gu.user_id = p.id
WHERE p.role IS NULL;

-- ============================================================================
-- END OF RESIDENT ROLE ASSIGNMENT
-- ============================================================================
