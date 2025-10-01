-- ============================================================================
-- FIX AUTHENTICATION TRIGGERS ONLY (For Future Users)
-- ============================================================================
-- This script only fixes the triggers to ensure future OAuth users are saved
-- as "resident" role. It doesn't try to insert existing users.

-- Step 1: Disable all conflicting triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_address_created ON auth.users;

-- Step 2: Drop conflicting functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_oauth_signin();
DROP FUNCTION IF EXISTS public.handle_new_user_address();

-- Step 3: Ensure roles table has the resident role
INSERT INTO public.roles (id, name, description, permissions) VALUES
('00000000-0000-0000-0000-000000000001', 'resident', 'Resident user', '{"can_view_own_data": true, "can_make_collections": true}')
ON CONFLICT (name) DO NOTHING;

-- Step 4: Create unified user creation function for NEW users only
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_full_name TEXT;
    user_phone TEXT;
    resident_role_id UUID;
BEGIN
    -- Extract user information from OAuth data or user metadata
    user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
    user_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'display_name',
        'User'
    );
    user_phone := COALESCE(
        NEW.raw_user_meta_data->>'phone',
        ''
    );
    
    -- Get the resident role ID
    SELECT id INTO resident_role_id 
    FROM public.roles 
    WHERE name = 'resident' 
    LIMIT 1;
    
    -- If no resident role, use a default UUID (this should not happen)
    IF resident_role_id IS NULL THEN
        resident_role_id := '00000000-0000-0000-0000-000000000001';
    END IF;
    
    -- Insert user into unified users table
    INSERT INTO public.users (
        id,
        email,
        full_name,
        phone,
        status,
        role_id,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        user_email,
        user_full_name,
        user_phone,
        'active',
        resident_role_id,
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, users.full_name),
        phone = COALESCE(EXCLUDED.phone, users.phone),
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create single trigger for new user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Create function to handle OAuth sign-in updates
CREATE OR REPLACE FUNCTION public.handle_oauth_signin()
RETURNS TRIGGER AS $$
DECLARE
    user_email TEXT;
    user_full_name TEXT;
    user_phone TEXT;
BEGIN
    -- Only process if this is an OAuth sign-in (has raw_user_meta_data)
    IF NEW.raw_user_meta_data IS NOT NULL THEN
        -- Extract user information from OAuth data
        user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
        user_full_name := COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'display_name',
            'User'
        );
        user_phone := COALESCE(
            NEW.raw_user_meta_data->>'phone',
            ''
        );
        
        -- Update existing user or create if doesn't exist
        INSERT INTO public.users (
            id,
            email,
            full_name,
            phone,
            status,
            role_id,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            user_email,
            user_full_name,
            user_phone,
            'active',
            (SELECT id FROM public.roles WHERE name = 'resident' LIMIT 1),
            NOW(),
            NOW()
        ) ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = COALESCE(EXCLUDED.full_name, users.full_name),
            phone = COALESCE(EXCLUDED.phone, users.phone),
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the sign-in
        RAISE WARNING 'Error in handle_oauth_signin for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger for OAuth sign-in updates
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_oauth_signin();

-- Success message
SELECT 'Authentication triggers fixed! Future users will be saved as "resident" role.' as message;
