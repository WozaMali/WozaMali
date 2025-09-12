-- Quick Fix: Allow Main App Access to Critical Tables
-- This is a simplified version that focuses on the most critical tables
-- Run this in your Supabase SQL Editor

-- 1. DISABLE RLS ON CRITICAL TABLES (TEMPORARY FIX)
-- This will immediately allow the main app to access data

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;

-- Disable RLS on enhanced_wallets if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhanced_wallets' AND table_schema = 'public') THEN
        ALTER TABLE public.enhanced_wallets DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Disable RLS on user_profiles if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. GRANT PERMISSIONS
-- Ensure all roles have access to the tables
GRANT ALL PRIVILEGES ON TABLE public.profiles TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.profiles TO anon;
GRANT ALL PRIVILEGES ON TABLE public.profiles TO service_role;

GRANT ALL PRIVILEGES ON TABLE public.wallets TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.wallets TO anon;
GRANT ALL PRIVILEGES ON TABLE public.wallets TO service_role;

GRANT ALL PRIVILEGES ON TABLE public.pickups TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.pickups TO anon;
GRANT ALL PRIVILEGES ON TABLE public.pickups TO service_role;

GRANT ALL PRIVILEGES ON TABLE public.materials TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.materials TO anon;
GRANT ALL PRIVILEGES ON TABLE public.materials TO service_role;

-- Grant permissions for enhanced_wallets if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhanced_wallets' AND table_schema = 'public') THEN
        GRANT ALL PRIVILEGES ON TABLE public.enhanced_wallets TO authenticated;
        GRANT ALL PRIVILEGES ON TABLE public.enhanced_wallets TO anon;
        GRANT ALL PRIVILEGES ON TABLE public.enhanced_wallets TO service_role;
    END IF;
END $$;

-- Grant permissions for user_profiles if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO authenticated;
        GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO anon;
        GRANT ALL PRIVILEGES ON TABLE public.user_profiles TO service_role;
    END IF;
END $$;

-- 3. VERIFY THE FIX
-- Check that RLS is disabled
SELECT 
    'RLS Status After Quick Fix' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'wallets', 'pickups', 'materials', 'enhanced_wallets', 'user_profiles')
ORDER BY tablename;

-- Test access to critical tables
SELECT 
    'Access Test - Profiles' as table_name,
    COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT 
    'Access Test - Wallets' as table_name,
    COUNT(*) as record_count
FROM public.wallets
UNION ALL
SELECT 
    'Access Test - Pickups' as table_name,
    COUNT(*) as record_count
FROM public.pickups
UNION ALL
SELECT 
    'Access Test - Materials' as table_name,
    COUNT(*) as record_count
FROM public.materials;

-- 4. SUCCESS MESSAGE
SELECT 
    '✅ QUICK FIX APPLIED' as status,
    'Main app should now be able to access all tables' as result,
    'Test your main app to verify it is working' as next_step;
