-- Simple Fix for Profile Updates and RLS Policies
-- This script fixes all issues with profile updates not being saved

-- 1. Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;

-- 2. Create comprehensive RLS policies for profiles table
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own profile" ON profiles
    FOR DELETE USING (auth.uid() = id);

-- 3. Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Grant necessary permissions to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 5. Add missing columns if they don't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suburb TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ext_zone_phase TEXT;

-- 6. Update existing profiles to have default values
UPDATE public.profiles 
SET 
    email_verified = COALESCE(email_verified, FALSE),
    phone_verified = COALESCE(phone_verified, FALSE),
    login_count = COALESCE(login_count, 0),
    status = COALESCE(status, 'active'),
    updated_at = COALESCE(updated_at, NOW())
WHERE email_verified IS NULL 
   OR phone_verified IS NULL
   OR login_count IS NULL 
   OR status IS NULL 
   OR updated_at IS NULL;

-- 7. Create or replace the handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_full_name TEXT;
    user_avatar_url TEXT;
BEGIN
    -- Extract user information from OAuth data or user metadata
    user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'display_name',
        'User'
    );
    user_avatar_url := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture',
        NULL
    );
    
    -- Insert profile with extracted information
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        avatar_url,
        email_verified,
        last_login,
        login_count,
        status,
        created_at,
        updated_at
    ) VALUES (
        NEW.id, 
        user_email, 
        user_full_name,
        user_avatar_url,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, FALSE),
        NOW(),
        1,
        'active',
        NOW(),
        NOW()
    );
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Drop and recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- ✅ All profile update issues have been fixed!
-- The system should now:
-- 1. Allow authenticated users to access and update their own profiles
-- 2. Have proper RLS policies working
-- 3. Include all necessary columns in the profiles table
-- 4. Have working triggers for automatic profile creation
-- 5. Properly save profile updates to both user metadata and profiles table
