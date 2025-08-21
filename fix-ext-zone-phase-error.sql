-- =====================================================
-- QUICK FIX FOR EXT_ZONE_PHASE COLUMN ERROR
-- Run this if you encounter the ext_zone_phase column error
-- =====================================================

-- First, let's check what columns actually exist in the backup table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles_backup' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- If ext_zone_phase doesn't exist, add it with a default value
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles_backup' 
        AND column_name = 'ext_zone_phase'
    ) THEN
        ALTER TABLE profiles_backup ADD COLUMN ext_zone_phase TEXT;
        RAISE NOTICE 'Added ext_zone_phase column to profiles_backup';
    ELSE
        RAISE NOTICE 'ext_zone_phase column already exists in profiles_backup';
    END IF;
END $$;

-- Now try to restore the profiles again
DO $$ 
BEGIN
    -- Check if profiles_backup exists and has data
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles_backup') THEN
        -- Clear existing profiles first (if any)
        DELETE FROM public.profiles WHERE id IN (SELECT id FROM profiles_backup);
        
        -- Restore profiles with all columns
        INSERT INTO public.profiles (
            id, email, full_name, phone, street_address, suburb, ext_zone_phase, 
            city, postal_code, avatar_url, email_verified, phone_verified, 
            last_login, login_count, status, role, office_id, created_at, updated_at
        )
        SELECT 
            id, 
            email, 
            full_name, 
            phone, 
            street_address, 
            suburb, 
            COALESCE(ext_zone_phase, '') as ext_zone_phase,
            COALESCE(city, 'Soweto') as city, 
            postal_code, 
            avatar_url, 
            email_verified, 
            phone_verified,
            last_login, 
            login_count, 
            status, 
            CASE 
                WHEN role = 'collector' THEN 'collector'
                WHEN role = 'admin' THEN 'admin'
                ELSE 'member'
            END as role,
            '00000000-0000-0000-0000-000000000001' as office_id, -- Default office
            created_at, 
            updated_at
        FROM profiles_backup;
        
        RAISE NOTICE 'Profiles restored successfully from backup';
    ELSE
        RAISE NOTICE 'No profiles_backup table found';
    END IF;
END $$;

-- Verify the restore worked
SELECT 
    'Profiles restored' as status,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role IS NOT NULL THEN 1 END) as profiles_with_role,
    COUNT(CASE WHEN office_id IS NOT NULL THEN 1 END) as profiles_with_office
FROM public.profiles;

-- Show role distribution
SELECT 
    role,
    COUNT(*) as count
FROM public.profiles 
GROUP BY role
ORDER BY count DESC;

RAISE NOTICE 'Fix completed! You can now continue with the office-role-setup.sql script.';
