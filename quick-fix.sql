-- Quick Fix for Signup Database Errors
-- Run this in your Supabase SQL Editor

-- 1. Fix the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert profile with all available fields
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
    email_verified
  )
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
    COALESCE(NEW.raw_user_meta_data->>'phone', null),
    COALESCE(NEW.raw_user_meta_data->>'street_address', null),
    COALESCE(NEW.raw_user_meta_data->>'suburb', null),
    COALESCE(NEW.raw_user_meta_data->>'ext_zone_phase', null),
    COALESCE(NEW.raw_user_meta_data->>'city', null),
    COALESCE(NEW.raw_user_meta_data->>'postal_code', null),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
  );
  
  -- Insert wallet
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  -- Log user registration activity
  INSERT INTO public.user_activity_log (
    user_id,
    activity_type,
    description,
    metadata
  )
  VALUES (
    NEW.id,
    'user_registration',
    'User registered successfully',
    jsonb_build_object(
      'email', NEW.email, 
      'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
      'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User')
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Check if there are any existing users that need to be synced
SELECT 
  'Auth Users' as table_name,
  COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
  'Profiles' as table_name,
  COUNT(*) as count
FROM public.profiles
UNION ALL
SELECT 
  'Wallets' as table_name,
  COUNT(*) as count
FROM public.wallets;

-- 4. If you have existing users without profiles, sync them
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
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 5. Create wallets for any synced users
INSERT INTO public.wallets (user_id, created_at, updated_at)
SELECT 
  p.id,
  p.created_at,
  NOW()
FROM public.profiles p
LEFT JOIN public.wallets w ON p.id = w.user_id
WHERE w.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 6. Verify the fix worked
SELECT 
  'Fix Summary' as summary,
  (SELECT COUNT(*) FROM auth.users) as auth_users_count,
  (SELECT COUNT(*) FROM public.profiles) as profiles_count,
  (SELECT COUNT(*) FROM public.wallets) as wallets_count,
  CASE 
    WHEN (SELECT COUNT(*) FROM auth.users) = (SELECT COUNT(*) FROM public.profiles) 
    AND (SELECT COUNT(*) FROM public.profiles) = (SELECT COUNT(*) FROM public.wallets)
    THEN '✅ All users synced successfully'
    ELSE '❌ Sync incomplete - check results above'
  END as sync_status;
