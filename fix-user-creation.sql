-- Fix User Creation Database Errors
-- Run this in your Supabase SQL Editor

-- 1. First, let's check if there are any existing errors
-- Run this to see what's happening:
SELECT 
  schemaname,
  tablename,
  attname,
  n_distinct,
  correlation
FROM pg_stats 
WHERE tablename IN ('profiles', 'wallets', 'auth_users');

-- 2. Drop and recreate the handle_new_user function with better error handling
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  profile_id UUID;
  wallet_id UUID;
BEGIN
  -- Add error logging
  RAISE NOTICE 'Creating profile for user: % with email: %', NEW.id, NEW.email;
  
  -- Check if profile already exists (prevent duplicates)
  SELECT id INTO profile_id FROM public.profiles WHERE id = NEW.id;
  IF profile_id IS NOT NULL THEN
    RAISE NOTICE 'Profile already exists for user: %', NEW.id;
    RETURN NEW;
  END IF;

  -- Insert profile with proper error handling
  BEGIN
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
      status,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id, 
      COALESCE(NEW.email, ''),
      COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
      COALESCE(NEW.raw_user_meta_data->>'phone', null),
      COALESCE(NEW.raw_user_meta_data->>'street_address', null),
      COALESCE(NEW.raw_user_meta_data->>'suburb', null),
      COALESCE(NEW.raw_user_meta_data->>'ext_zone_phase', null),
      COALESCE(NEW.raw_user_meta_data->>'city', null),
      COALESCE(NEW.raw_user_meta_data->>'postal_code', null),
      COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
      'active',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Profile created successfully for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE EXCEPTION 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;

  -- Check if wallet already exists
  SELECT id INTO wallet_id FROM public.wallets WHERE user_id = NEW.id;
  IF wallet_id IS NULL THEN
    -- Insert wallet with error handling
    BEGIN
      INSERT INTO public.wallets (
        user_id,
        balance,
        total_points,
        tier,
        created_at,
        updated_at
      )
      VALUES (
        NEW.id,
        0.00,
        0,
        'Gold Recycler',
        NOW(),
        NOW()
      );
      
      RAISE NOTICE 'Wallet created successfully for user: %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to create wallet for user %: %', NEW.id, SQLERRM;
    END;
  ELSE
    RAISE NOTICE 'Wallet already exists for user: %', NEW.id;
  END IF;

  -- Log user registration activity with error handling
  BEGIN
    INSERT INTO public.user_activity_log (
      user_id,
      activity_type,
      description,
      metadata,
      created_at
    )
    VALUES (
      NEW.id,
      'user_registration',
      'User registered successfully',
      jsonb_build_object(
        'email', COALESCE(NEW.email, ''),
        'provider', COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
        'full_name', COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown User'),
        'registration_time', NOW()
      ),
      NOW()
    );
    
    RAISE NOTICE 'Activity log created for user: %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create activity log for user %: %', NEW.id, SQLERRM;
      -- Don't fail the entire operation if logging fails
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'handle_new_user failed for user %: %', NEW.id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Ensure the trigger is properly set up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix any existing profiles that might be missing required fields
UPDATE public.profiles 
SET 
  email = COALESCE(email, 'unknown@example.com'),
  full_name = COALESCE(full_name, 'Unknown User'),
  status = COALESCE(status, 'active'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE email IS NULL OR full_name IS NULL OR status IS NULL;

-- 5. Fix any existing wallets that might be missing required fields
UPDATE public.wallets 
SET 
  balance = COALESCE(balance, 0.00),
  total_points = COALESCE(total_points, 0),
  tier = COALESCE(tier, 'Gold Recycler'),
  created_at = COALESCE(created_at, NOW()),
  updated_at = COALESCE(updated_at, NOW())
WHERE balance IS NULL OR total_points IS NULL OR tier IS NULL;

-- 6. Create missing profiles for existing auth.users (if any)
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
  status,
  created_at,
  updated_at
)
SELECT 
  au.id,
  COALESCE(au.email, 'unknown@example.com'),
  COALESCE(au.raw_user_meta_data->>'full_name', 'Unknown User'),
  COALESCE(au.raw_user_meta_data->>'phone', null),
  COALESCE(au.raw_user_meta_data->>'street_address', null),
  COALESCE(au.raw_user_meta_data->>'suburb', null),
  COALESCE(au.raw_user_meta_data->>'ext_zone_phase', null),
  COALESCE(au.raw_user_meta_data->>'city', null),
  COALESCE(au.raw_user_meta_data->>'postal_code', null),
  COALESCE(au.email_confirmed_at IS NOT NULL, false),
  'active',
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 7. Create missing wallets for existing profiles (if any)
INSERT INTO public.wallets (
  user_id,
  balance,
  total_points,
  tier,
  created_at,
  updated_at
)
SELECT 
  p.id,
  0.00,
  0,
  'Gold Recycler',
  COALESCE(p.created_at, NOW()),
  NOW()
FROM public.profiles p
LEFT JOIN public.wallets w ON p.id = w.user_id
WHERE w.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 8. Add better error handling to the profiles table
ALTER TABLE public.profiles 
ALTER COLUMN email SET DEFAULT '',
ALTER COLUMN full_name SET DEFAULT 'Unknown User',
ALTER COLUMN status SET DEFAULT 'active';

-- 9. Add better error handling to the wallets table
ALTER TABLE public.wallets 
ALTER COLUMN balance SET DEFAULT 0.00,
ALTER COLUMN total_points SET DEFAULT 0,
ALTER COLUMN tier SET DEFAULT 'Gold Recycler';

-- 10. Create a test function to verify everything works
CREATE OR REPLACE FUNCTION test_user_creation()
RETURNS TEXT AS $$
DECLARE
  test_user_id UUID;
  profile_count INTEGER;
  wallet_count INTEGER;
BEGIN
  -- Create a test user (this will trigger the handle_new_user function)
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    raw_app_meta_data
  ) VALUES (
    gen_random_uuid(),
    'test@example.com',
    'test_password_hash',
    NOW(),
    NOW(),
    NOW(),
    '{"full_name": "Test User", "city": "Test City"}'::jsonb,
    '{"provider": "email"}'::jsonb
  ) RETURNING id INTO test_user_id;
  
  -- Check if profile was created
  SELECT COUNT(*) INTO profile_count FROM public.profiles WHERE id = test_user_id;
  
  -- Check if wallet was created
  SELECT COUNT(*) INTO wallet_count FROM public.wallets WHERE user_id = test_user_id;
  
  -- Clean up test user
  DELETE FROM auth.users WHERE id = test_user_id;
  
  IF profile_count = 1 AND wallet_count = 1 THEN
    RETURN 'User creation test PASSED - Profile and wallet created successfully';
  ELSE
    RETURN format('User creation test FAILED - Profile count: %, Wallet count: %', profile_count, wallet_count);
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN format('User creation test FAILED with error: %', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.test_user_creation() TO service_role;

-- 12. Verify RLS policies are correct
-- Make sure these policies exist and are working:
-- Users can insert their own profile
-- Users can view their own profile
-- Users can update their own profile

-- 13. Test the fix
-- Run this to test if user creation works:
-- SELECT test_user_creation();

-- 14. Monitor for errors
-- Check the Supabase logs for any remaining errors after running this script

-- Summary of fixes applied:
-- ✅ Recreated handle_new_user function with better error handling
-- ✅ Added proper null checks and defaults
-- ✅ Fixed existing data inconsistencies
-- ✅ Added comprehensive error logging
-- ✅ Created test function to verify functionality
-- ✅ Ensured proper trigger setup
-- ✅ Added missing profiles and wallets for existing users

-- After running this script:
-- 1. Try creating a new user through your signup form
-- 2. Check the Supabase logs for any errors
-- 3. Verify that profiles and wallets are created automatically
-- 4. Run the test function: SELECT test_user_creation();
