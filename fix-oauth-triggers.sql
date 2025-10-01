-- ============================================================================
-- FIX OAUTH DATABASE TRIGGERS
-- ============================================================================
-- This script disables conflicting database triggers that are causing OAuth failures

-- Disable the problematic triggers that are causing "Database error saving new user"
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_address_created ON auth.users;

-- Drop the conflicting functions
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.handle_oauth_signin();
DROP FUNCTION IF EXISTS public.handle_new_user_address();

-- Create a simple, non-conflicting trigger that just logs the user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS TRIGGER AS $$
BEGIN
    -- Just log the user creation, don't try to create any records
    -- This prevents the "Database error saving new user" error
    RAISE NOTICE 'New user created: %', NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the user creation
        RAISE WARNING 'Error in handle_new_user_simple for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simple trigger that won't cause conflicts
CREATE TRIGGER on_auth_user_created_simple
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check that triggers are disabled
SELECT 
    trigger_name, 
    event_manipulation, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
AND event_object_schema = 'auth';
