-- Fix Google OAuth Authentication Issues (Safe Version)
-- This script safely updates the user profile creation and OAuth handling
-- It handles existing policies and functions gracefully

-- 1. Safely drop existing triggers and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_oauth_signin() CASCADE;

-- 2. Create improved handle_new_user function
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

-- 3. Create function to handle OAuth sign-in updates
CREATE OR REPLACE FUNCTION public.handle_oauth_signin()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_full_name TEXT;
    user_avatar_url TEXT;
BEGIN
    -- Extract user information from OAuth data
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
    
    -- Update existing profile or create if doesn't exist
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        avatar_url,
        email_verified,
        last_login,
        login_count,
        status,
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
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        email_verified = EXCLUDED.email_verified,
        last_login = EXCLUDED.last_login,
        login_count = profiles.login_count + 1,
        updated_at = EXCLUDED.updated_at;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the sign-in
        RAISE WARNING 'Error in handle_oauth_signin for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create triggers
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_oauth_signin();

-- 5. Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_oauth_signin() TO service_role;

-- 6. Safely ensure profiles table has all necessary columns
DO $$ 
BEGIN
    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to profiles table';
    END IF;
    
    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added email_verified column to profiles table';
    END IF;
    
    -- Add last_login column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'last_login') THEN
        ALTER TABLE public.profiles ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_login column to profiles table';
    END IF;
    
    -- Add login_count column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'login_count') THEN
        ALTER TABLE public.profiles ADD COLUMN login_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added login_count column to profiles table';
    END IF;
    
    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added status column to profiles table';
    END IF;
END $$;

-- 7. Safely update existing profiles to have default values
UPDATE public.profiles 
SET 
    email_verified = COALESCE(email_verified, FALSE),
    login_count = COALESCE(login_count, 0),
    status = COALESCE(status, 'active'),
    updated_at = COALESCE(updated_at, NOW())
WHERE email_verified IS NULL 
   OR login_count IS NULL 
   OR status IS NULL 
   OR updated_at IS NULL;

-- 8. Ensure wallet trigger exists (only if it doesn't already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_profile_created' 
        AND tgrelid = 'public.profiles'::regclass
    ) THEN
        -- Create the wallet trigger only if it doesn't exist
        CREATE TRIGGER on_profile_created
            AFTER INSERT ON profiles
            FOR EACH ROW EXECUTE FUNCTION public.handle_new_wallet();
        RAISE NOTICE 'Created wallet trigger for new profiles';
    ELSE
        RAISE NOTICE 'Wallet trigger already exists, skipping creation';
    END IF;
END $$;

-- ✅ Google OAuth fixes applied successfully!
-- The system will now:
-- 1. Properly extract user information from Google OAuth data
-- 2. Create profiles automatically for new OAuth users
-- 3. Update existing profiles on OAuth sign-ins
-- 4. Handle errors gracefully without breaking authentication
-- 5. Track login counts and last login times
-- 6. Safely handle existing database objects
