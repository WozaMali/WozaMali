-- ============================================================================
-- CREATE TEST USER FOR COLLECTOR SERVICE
-- ============================================================================
-- This script creates a test user that matches the demo credentials
-- Run this in your Supabase SQL Editor

-- First, let's check what the current database structure looks like
DO $$
DECLARE
    table_exists BOOLEAN;
    has_is_active BOOLEAN;
    has_created_at BOOLEAN;
    has_phone BOOLEAN;
    user_exists BOOLEAN;
    existing_user_id uuid;
BEGIN
    -- Check if profiles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'profiles'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RAISE NOTICE 'Profiles table does not exist. Creating it...';
        
        -- Create basic profiles table with proper foreign key to auth.users
        CREATE TABLE profiles (
            id uuid primary key references auth.users(id) on delete cascade,
            email text unique not null,
            full_name text,
            role text not null check (role in ('customer','collector','admin'))
        );
        
        RAISE NOTICE 'Profiles table created successfully.';
    ELSE
        RAISE NOTICE 'Profiles table already exists.';
        
        -- Check what columns exist
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'is_active'
        ) INTO has_is_active;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'created_at'
        ) INTO has_created_at;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'profiles' AND column_name = 'phone'
        ) INTO has_phone;
        
        RAISE NOTICE 'Column check: is_active=%, created_at=%, phone=%', has_is_active, has_created_at, has_phone;
    END IF;
    
    -- Check if the test user already exists in auth.users
    SELECT EXISTS (
        SELECT 1 FROM auth.users 
        WHERE email = 'col001@wozamali.com'
    ) INTO user_exists;
    
    IF user_exists THEN
        -- Get the existing user's ID
        SELECT id FROM auth.users WHERE email = 'col001@wozamali.com' INTO existing_user_id;
        RAISE NOTICE 'User already exists in auth.users with ID: %', existing_user_id;
    ELSE
        RAISE NOTICE 'User does not exist in auth.users. You need to create the user first.';
        RAISE NOTICE 'Please go to Supabase Dashboard → Authentication → Users and create a user with:';
        RAISE NOTICE 'Email: col001@wozamali.com';
        RAISE NOTICE 'Password: collector123';
        RAISE NOTICE 'Then run this script again.';
        RETURN;
    END IF;
END $$;

-- Now let's create the test user profile with the existing user ID
DO $$
DECLARE
    existing_user_id uuid;
    has_is_active BOOLEAN;
    has_created_at BOOLEAN;
    has_phone BOOLEAN;
BEGIN
    -- Get the existing user's ID
    SELECT id FROM auth.users WHERE email = 'col001@wozamali.com' INTO existing_user_id;
    
    IF existing_user_id IS NULL THEN
        RAISE NOTICE 'User not found in auth.users. Please create the user first.';
        RETURN;
    END IF;
    
    -- Check what columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'is_active'
    ) INTO has_is_active;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'created_at'
    ) INTO has_created_at;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'phone'
    ) INTO has_phone;
    
    -- Insert user profile with available columns
    IF has_is_active AND has_created_at AND has_phone THEN
        -- Full schema
        INSERT INTO profiles (id, email, full_name, phone, role, is_active, created_at) 
        VALUES (
            existing_user_id,
            'col001@wozamali.com',
            'John Collector',
            '+27123456789',
            'collector',
            true,
            now()
        ) ON CONFLICT (email) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            phone = EXCLUDED.phone,
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active,
            created_at = EXCLUDED.created_at;
    ELSIF has_is_active AND has_created_at THEN
        -- Without phone
        INSERT INTO profiles (id, email, full_name, role, is_active, created_at) 
        VALUES (
            existing_user_id,
            'col001@wozamali.com',
            'John Collector',
            'collector',
            true,
            now()
        ) ON CONFLICT (email) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active,
            created_at = EXCLUDED.created_at;
    ELSIF has_is_active THEN
        -- Without phone and created_at
        INSERT INTO profiles (id, email, full_name, role, is_active) 
        VALUES (
            existing_user_id,
            'col001@wozamali.com',
            'John Collector',
            'collector',
            true
        ) ON CONFLICT (email) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role,
            is_active = EXCLUDED.is_active;
    ELSE
        -- Basic schema only
        INSERT INTO profiles (id, email, full_name, role) 
        VALUES (
            existing_user_id,
            'col001@wozamali.com',
            'John Collector',
            'collector'
        ) ON CONFLICT (email) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            role = EXCLUDED.role;
    END IF;
    
    RAISE NOTICE 'Test user profile created successfully with ID: %', existing_user_id;
END $$;

-- Verify the user was created
SELECT * FROM profiles WHERE email = 'col001@wozamali.com';

-- Show the current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Show the foreign key constraints
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='profiles';

-- Note: This script now properly handles the foreign key constraint.
-- Make sure you have created the user in Supabase Auth first:
-- 1. Go to Supabase Dashboard → Authentication → Users
-- 2. Create a new user with email: col001@wozamali.com and password: collector123
-- 3. Then run this script to create the profile
