-- Woza Mali Database Migration Script
-- Run this AFTER running the main schema setup
-- This script syncs existing users and handles data migration

-- 1. First, let's check what users exist in auth.users
SELECT 
  id,
  email,
  raw_user_meta_data,
  email_confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at;

-- 2. Sync existing users to profiles table
-- This will create profiles for users who don't have them yet
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  phone,
  street_address,
  suburb,
  ext_zone_phase,
  city,
  postal_code,
  email_verified,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown User'),
  au.raw_user_meta_data->>'phone',
  au.raw_user_meta_data->>'street_address',
  au.raw_user_meta_data->>'suburb',
  au.raw_user_meta_data->>'ext_zone_phase',
  au.raw_user_meta_data->>'city',
  au.raw_user_meta_data->>'postal_code',
  au.email_confirmed_at IS NOT NULL,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. Create wallets for users who don't have them
INSERT INTO public.wallets (user_id, created_at, updated_at)
SELECT 
  p.id,
  p.created_at,
  NOW()
FROM public.profiles p
LEFT JOIN public.wallets w ON p.id = w.user_id
WHERE w.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 4. Update existing profiles with verified email status
UPDATE public.profiles 
SET 
  email_verified = CASE 
    WHEN auth.users.email_confirmed_at IS NOT NULL THEN true 
    ELSE false 
  END,
  updated_at = NOW()
FROM auth.users 
WHERE public.profiles.id = auth.users.id;

-- 5. Log the migration activity for existing users
INSERT INTO public.user_activity_log (
  user_id,
  activity_type,
  description,
  metadata
)
SELECT 
  p.id,
  'migration_sync',
  'User profile synced during database migration',
  jsonb_build_object(
    'migration_date', NOW(),
    'original_created_at', p.created_at,
    'email_verified', p.email_verified
  )
FROM public.profiles p
WHERE p.created_at < NOW() - INTERVAL '1 hour' -- Only for existing users, not newly created ones
ON CONFLICT DO NOTHING;

-- 6. Verify the sync worked
-- Check profiles count
SELECT 
  'Profiles' as table_name,
  COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT 
  'Wallets' as table_name,
  COUNT(*) as record_count
FROM public.wallets
UNION ALL
SELECT 
  'Auth Users' as table_name,
  COUNT(*) as record_count
FROM auth.users;

-- 7. Check for any users that might not have been synced
SELECT 
  'Users without profiles' as issue,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL

UNION ALL

SELECT 
  'Profiles without wallets' as issue,
  COUNT(*) as count
FROM public.profiles p
LEFT JOIN public.wallets w ON p.id = w.user_id
WHERE w.user_id IS NULL;

-- 8. Show sample of synced data
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.email_verified,
  p.created_at,
  w.balance,
  w.total_points
FROM public.profiles p
LEFT JOIN public.wallets w ON p.id = w.user_id
ORDER BY p.created_at DESC
LIMIT 10;

-- 9. If you need to manually sync a specific user, use this:
-- Replace 'user@example.com' with the actual email
/*
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  email_verified,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown User'),
  au.email_confirmed_at IS NOT NULL,
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.email = 'user@example.com'
ON CONFLICT (id) DO UPDATE SET
  email_verified = EXCLUDED.email_verified,
  updated_at = NOW();
*/

-- 10. Clean up any orphaned records (optional - run with caution)
-- This will remove profiles that don't have corresponding auth.users
/*
DELETE FROM public.profiles 
WHERE id NOT IN (SELECT id FROM auth.users);
*/

-- 11. Reset sequences if needed (PostgreSQL specific)
-- This ensures new IDs are generated correctly
SELECT setval(pg_get_serial_sequence('public.profiles', 'id'), 
       COALESCE((SELECT MAX(id::text::bigint) FROM public.profiles), 1));

-- 12. Final verification query
-- This should show all users are properly synced
SELECT 
  'Migration Summary' as summary,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.wallets) as wallets_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.profiles) 
    AND (SELECT COUNT(*) FROM public.profiles) = (SELECT COUNT(*) FROM public.wallets)
    THEN '✅ All users synced successfully'
    ELSE '❌ Sync incomplete - check results above'
  END as sync_status;
