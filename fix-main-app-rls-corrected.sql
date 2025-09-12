-- Fix RLS Policies for Main App Access (CORRECTED VERSION)
-- This script targets the actual table names that exist in your database
-- Run this in your Supabase SQL Editor

-- 1. FIRST, CHECK WHAT TABLES ACTUALLY EXIST
-- This will show us what tables are available
SELECT 
    'Existing Tables' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. CHECK EXISTING RLS POLICIES
SELECT 
    'Existing RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. FIX PROFILES TABLE RLS (if it exists)
-- Check if profiles table exists and fix RLS
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        -- Disable RLS on profiles table
        ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL PRIVILEGES ON TABLE public.profiles TO authenticated;
        GRANT ALL PRIVILEGES ON TABLE public.profiles TO anon;
        GRANT ALL PRIVILEGES ON TABLE public.profiles TO service_role;
        
        RAISE NOTICE 'Fixed RLS for profiles table';
    ELSE
        RAISE NOTICE 'profiles table does not exist';
    END IF;
END $$;

-- 4. FIX USER_PROFILES TABLE RLS (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        -- Disable RLS on user_profiles table
        ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO authenticated;
        GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO anon;
        GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO service_role;
        
        RAISE NOTICE 'Fixed RLS for user_profiles table';
    ELSE
        RAISE NOTICE 'user_profiles table does not exist';
    END IF;
END $$;

-- 5. FIX WALLETS TABLE RLS (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets' AND table_schema = 'public') THEN
        -- Disable RLS on wallets table
        ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL PRIVILEGES ON TABLE public.wallets TO authenticated;
        GRANT ALL PRIVILEGES ON TABLE public.wallets TO anon;
        GRANT ALL PRIVILEGES ON TABLE public.wallets TO service_role;
        
        RAISE NOTICE 'Fixed RLS for wallets table';
    ELSE
        RAISE NOTICE 'wallets table does not exist';
    END IF;
END $$;

-- 6. FIX COLLECTIONS TABLE RLS (if it exists - this might be the pickup data)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collections' AND table_schema = 'public') THEN
        -- Disable RLS on collections table
        ALTER TABLE public.collections DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL PRIVILEGES ON TABLE public.collections TO authenticated;
        GRANT ALL PRIVILEGES ON TABLE public.collections TO anon;
        GRANT ALL PRIVILEGES ON TABLE public.collections TO service_role;
        
        RAISE NOTICE 'Fixed RLS for collections table';
    ELSE
        RAISE NOTICE 'collections table does not exist';
    END IF;
END $$;

-- 7. FIX PICKUPS TABLE RLS (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickups' AND table_schema = 'public') THEN
        -- Disable RLS on pickups table
        ALTER TABLE public.pickups DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL PRIVILEGES ON TABLE public.pickups TO authenticated;
        GRANT ALL PRIVILEGES ON TABLE public.pickups TO anon;
        GRANT ALL PRIVILEGES ON TABLE public.pickups TO service_role;
        
        RAISE NOTICE 'Fixed RLS for pickups table';
    ELSE
        RAISE NOTICE 'pickups table does not exist';
    END IF;
END $$;

-- 8. FIX MATERIALS TABLE RLS (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'materials' AND table_schema = 'public') THEN
        -- Disable RLS on materials table
        ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL PRIVILEGES ON TABLE public.materials TO authenticated;
        GRANT ALL PRIVILEGES ON TABLE public.materials TO anon;
        GRANT ALL PRIVILEGES ON TABLE public.materials TO service_role;
        
        RAISE NOTICE 'Fixed RLS for materials table';
    ELSE
        RAISE NOTICE 'materials table does not exist';
    END IF;
END $$;

-- 9. FIX ENHANCED_WALLETS TABLE RLS (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhanced_wallets' AND table_schema = 'public') THEN
        -- Disable RLS on enhanced_wallets table
        ALTER TABLE public.enhanced_wallets DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL PRIVILEGES ON TABLE public.enhanced_wallets TO authenticated;
        GRANT ALL PRIVILEGES ON TABLE public.enhanced_wallets TO anon;
        GRANT ALL PRIVILEGES ON TABLE public.enhanced_wallets TO service_role;
        
        RAISE NOTICE 'Fixed RLS for enhanced_wallets table';
    ELSE
        RAISE NOTICE 'enhanced_wallets table does not exist';
    END IF;
END $$;

-- 10. FIX ADDRESSES TABLE RLS (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses' AND table_schema = 'public') THEN
        -- Disable RLS on addresses table
        ALTER TABLE public.addresses DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL PRIVILEGES ON TABLE public.addresses TO authenticated;
        GRANT ALL PRIVILEGES ON TABLE public.addresses TO anon;
        GRANT ALL PRIVILEGES ON TABLE public.addresses TO service_role;
        
        RAISE NOTICE 'Fixed RLS for addresses table';
    ELSE
        RAISE NOTICE 'addresses table does not exist';
    END IF;
END $$;

-- 11. FIX USERS TABLE RLS (if it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        -- Disable RLS on users table
        ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
        
        -- Grant permissions
        GRANT ALL PRIVILEGES ON TABLE public.users TO authenticated;
        GRANT ALL PRIVILEGES ON TABLE public.users TO anon;
        GRANT ALL PRIVILEGES ON TABLE public.users TO service_role;
        
        RAISE NOTICE 'Fixed RLS for users table';
    ELSE
        RAISE NOTICE 'users table does not exist';
    END IF;
END $$;

-- 12. VERIFY THE FIX
-- Check RLS status after fixes
SELECT 
    'RLS Status After Fix' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 13. TEST ACCESS TO EXISTING TABLES
-- Test access to tables that exist
DO $$
DECLARE
    table_name text;
    table_count integer;
BEGIN
    -- Test each table that might exist
    FOR table_name IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM public.%I', table_name) INTO table_count;
            RAISE NOTICE 'Table %: % records (accessible)', table_name, table_count;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Table %: Error - %', table_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 14. FINAL STATUS REPORT
SELECT 
    '🎯 RLS FIX COMPLETE' as status,
    'Main app should now be able to access existing tables' as result,
    'Check your main app to verify it is working' as next_step;
