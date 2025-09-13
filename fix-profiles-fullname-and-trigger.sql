-- ============================================================================
-- Ensure profiles.full_name is always populated and harden signup trigger
-- Also includes a backfill for existing NULL/blank full_name values
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- 1) Harden the signup trigger to always derive a non-null full_name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  first_name TEXT := COALESCE(NEW.raw_user_meta_data->>'first_name', NULL);
  last_name  TEXT := COALESCE(NEW.raw_user_meta_data->>'last_name', NULL);
  derived_full_name TEXT := NULL;
BEGIN
  -- Derive a safe full_name from metadata or email local-part
  derived_full_name := NULLIF(TRIM(
    COALESCE(NEW.raw_user_meta_data->>'full_name', '') || ' ' ||
    COALESCE(NULLIF(first_name, ''), '') || ' ' ||
    COALESCE(NULLIF(last_name, ''), '')
  ), '');

  IF derived_full_name IS NULL THEN
    derived_full_name := COALESCE(
      NEW.raw_user_meta_data->>'name',
      split_part(COALESCE(NEW.email, 'User'), '@', 1),
      'User'
    );
  END IF;

  INSERT INTO public.profiles (
    id, email, full_name, phone, street_address, suburb, ext_zone_phase, city, postal_code,
    email_verified, is_active, avatar_url, login_count, status, created_at, updated_at, role
  ) VALUES (
    NEW.id,
    NEW.email,
    derived_full_name,
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    COALESCE(NEW.raw_user_meta_data->>'street_address', NULL),
    COALESCE(NEW.raw_user_meta_data->>'suburb', NULL),
    COALESCE(NEW.raw_user_meta_data->>'ext_zone_phase', NULL),
    COALESCE(NEW.raw_user_meta_data->>'city', NULL),
    COALESCE(NEW.raw_user_meta_data->>'postal_code', NULL),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
    TRUE,
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', NULL),
    0,
    'active',
    NOW(),
    NOW(),
    'resident'
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name,
      email = EXCLUDED.email,
      updated_at = NOW()
  WHERE public.profiles.full_name IS NULL OR public.profiles.full_name = '';

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Backfill existing profiles with NULL/blank full_name
UPDATE public.profiles p
SET full_name = COALESCE(
  NULLIF(TRIM(
    COALESCE((au.raw_user_meta_data->>'full_name')::text, '') || ' ' ||
    COALESCE((au.raw_user_meta_data->>'first_name')::text, '') || ' ' ||
    COALESCE((au.raw_user_meta_data->>'last_name')::text, '')
  ), ''),
  COALESCE((au.raw_user_meta_data->>'name')::text, split_part(p.email, '@', 1), 'User')
),
    updated_at = NOW()
FROM auth.users au
WHERE p.id = au.id
  AND (p.full_name IS NULL OR p.full_name = '');

-- 3) Optional: enforce NOT NULL (uncomment after verifying no NULLs remain)
-- ALTER TABLE public.profiles ALTER COLUMN full_name SET NOT NULL;

-- 4) Verify
-- SELECT id, email, full_name FROM public.profiles WHERE full_name IS NULL OR full_name = '';


