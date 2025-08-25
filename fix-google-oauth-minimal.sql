-- Minimal Google OAuth Fix (Safe for existing databases)
-- This script only updates the essential functions for Google OAuth
-- It doesn't touch existing policies or table structures

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

-- ✅ Minimal Google OAuth fixes applied successfully!
-- The system will now:
-- 1. Properly extract user information from Google OAuth data
-- 2. Create profiles automatically for new OAuth users
-- 3. Update existing profiles on OAuth sign-ins
-- 4. Handle errors gracefully without breaking authentication
-- 5. Track login counts and last login times
