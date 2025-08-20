-- WozaMoney Profiles Table Update Script
-- This script updates the public.profiles table to accommodate the new location fields

-- 1. Add missing columns to profiles table if they don't exist
DO $$
BEGIN
    -- Add full_name column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
        RAISE NOTICE 'Added full_name column to profiles table';
    ELSE
        RAISE NOTICE 'full_name column already exists in profiles table';
    END IF;

    -- Add phone column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone') THEN
        ALTER TABLE public.profiles ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to profiles table';
    ELSE
        RAISE NOTICE 'phone column already exists in profiles table';
    END IF;

    -- Add street_address column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'street_address') THEN
        ALTER TABLE public.profiles ADD COLUMN street_address TEXT;
        RAISE NOTICE 'Added street_address column to profiles table';
    ELSE
        RAISE NOTICE 'street_address column already exists in profiles table';
    END IF;

    -- Add township column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'township') THEN
        ALTER TABLE public.profiles ADD COLUMN township TEXT;
        RAISE NOTICE 'Added township column to profiles table';
    ELSE
        RAISE NOTICE 'township column already exists in profiles table';
    END IF;

    -- Add city column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'city') THEN
        ALTER TABLE public.profiles ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column to profiles table';
    ELSE
        RAISE NOTICE 'city column already exists in profiles table';
    END IF;

    -- Add postal_code column
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'postal_code') THEN
        ALTER TABLE public.profiles ADD COLUMN postal_code TEXT;
        RAISE NOTICE 'Added postal_code column to profiles table';
    ELSE
        RAISE NOTICE 'postal_code column already exists in profiles table';
    END IF;

    -- Add avatar_url column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
        RAISE NOTICE 'Added avatar_url column to profiles table';
    ELSE
        RAISE NOTICE 'avatar_url column already exists in profiles table';
    END IF;

    -- Add status column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE public.profiles ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added status column to profiles table';
    ELSE
        RAISE NOTICE 'status column already exists in profiles table';
    END IF;

    -- Add email_verified column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added email_verified column to profiles table';
    ELSE
        RAISE NOTICE 'email_verified column already exists in profiles table';
    END IF;

    -- Add phone_verified column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'phone_verified') THEN
        ALTER TABLE public.profiles ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added phone_verified column to profiles table';
    ELSE
        RAISE NOTICE 'phone_verified column already exists in profiles table';
    END IF;

    -- Add last_login column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'last_login') THEN
        ALTER TABLE public.profiles ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added last_login column to profiles table';
    ELSE
        RAISE NOTICE 'last_login column already exists in profiles table';
    END IF;

    -- Add login_count column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'login_count') THEN
        ALTER TABLE public.profiles ADD COLUMN login_count INTEGER DEFAULT 0;
        RAISE NOTICE 'Added login_count column to profiles table';
    ELSE
        RAISE NOTICE 'login_count column already exists in profiles table';
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column to profiles table';
    ELSE
        RAISE NOTICE 'updated_at column already exists in profiles table';
    END IF;

END $$;

-- 2. Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_profiles_township ON public.profiles(township);
CREATE INDEX IF NOT EXISTS idx_profiles_city ON public.profiles(city);
CREATE INDEX IF NOT EXISTS idx_profiles_postal_code ON public.profiles(postal_code);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);

-- 3. Update the handle_new_user function to include the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        phone,
        street_address,
        township,
        city,
        postal_code,
        avatar_url,
        status,
        email_verified,
        phone_verified,
        role,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        COALESCE(NEW.raw_user_meta_data->>'street_address', ''),
        COALESCE(NEW.raw_user_meta_data->>'township', ''),
        COALESCE(NEW.raw_user_meta_data->>'city', ''),
        COALESCE(NEW.raw_user_meta_data->>'postal_code', ''),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        'active',
        FALSE,
        FALSE,
        'user',
        TRUE,
        NOW(),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Verify the updated table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 5. Show sample data (if any exists)
SELECT 
    id,
    email,
    full_name,
    township,
    city,
    postal_code,
    created_at
FROM public.profiles 
LIMIT 5;
