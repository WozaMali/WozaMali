-- Fix RLS Policies to Allow Main App Access
-- This script fixes RLS policies that are blocking the main app from accessing data
-- Run this in your Supabase SQL Editor

-- 1. DIAGNOSE CURRENT RLS STATUS
-- Check which tables have RLS enabled and what policies exist
SELECT 
    'Current RLS Status' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'wallets', 'pickups', 'materials', 'enhanced_wallets', 'user_profiles')
ORDER BY tablename;

-- Check existing policies
SELECT 
    'Existing RLS Policies' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'wallets', 'pickups', 'materials', 'enhanced_wallets', 'user_profiles')
ORDER BY tablename, policyname;

-- 2. FIX PROFILES TABLE RLS
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Office app can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Office app can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Office app can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Office app can delete profiles" ON public.profiles;

-- Create new permissive policies for profiles
CREATE POLICY "Allow authenticated users to view profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert profiles" ON public.profiles
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update profiles" ON public.profiles
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete profiles" ON public.profiles
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. FIX WALLETS TABLE RLS
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Users can update their own wallet" ON public.wallets;
DROP POLICY IF EXISTS "Admins can view all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can update all wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can insert wallets" ON public.wallets;
DROP POLICY IF EXISTS "Admins can delete wallets" ON public.wallets;

-- Create new permissive policies for wallets
CREATE POLICY "Allow authenticated users to view wallets" ON public.wallets
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert wallets" ON public.wallets
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update wallets" ON public.wallets
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete wallets" ON public.wallets
    FOR DELETE USING (auth.role() = 'authenticated');

-- 4. FIX PICKUPS TABLE RLS
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own pickups" ON public.pickups;
DROP POLICY IF EXISTS "Users can insert their own pickups" ON public.pickups;
DROP POLICY IF EXISTS "Users can update their own pickups" ON public.pickups;
DROP POLICY IF EXISTS "Collectors can view all pickups" ON public.pickups;
DROP POLICY IF EXISTS "Admins can view all pickups" ON public.pickups;
DROP POLICY IF EXISTS "Admins can update all pickups" ON public.pickups;

-- Create new permissive policies for pickups
CREATE POLICY "Allow authenticated users to view pickups" ON public.pickups
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert pickups" ON public.pickups
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update pickups" ON public.pickups
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete pickups" ON public.pickups
    FOR DELETE USING (auth.role() = 'authenticated');

-- 5. FIX MATERIALS TABLE RLS
-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can insert materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can update materials" ON public.materials;
DROP POLICY IF EXISTS "Admins can delete materials" ON public.materials;

-- Create new permissive policies for materials
CREATE POLICY "Allow authenticated users to view materials" ON public.materials
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert materials" ON public.materials
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update materials" ON public.materials
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete materials" ON public.materials
    FOR DELETE USING (auth.role() = 'authenticated');

-- 6. FIX ENHANCED_WALLETS TABLE RLS (if it exists)
-- Check if enhanced_wallets table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhanced_wallets' AND table_schema = 'public') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own enhanced wallet" ON public.enhanced_wallets;
        DROP POLICY IF EXISTS "Users can update their own enhanced wallet" ON public.enhanced_wallets;
        DROP POLICY IF EXISTS "Admins can view all enhanced wallets" ON public.enhanced_wallets;
        DROP POLICY IF EXISTS "Admins can update all enhanced wallets" ON public.enhanced_wallets;
        DROP POLICY IF EXISTS "Admins can insert enhanced wallets" ON public.enhanced_wallets;
        DROP POLICY IF EXISTS "Admins can delete enhanced wallets" ON public.enhanced_wallets;

        -- Create new permissive policies for enhanced_wallets
        CREATE POLICY "Allow authenticated users to view enhanced wallets" ON public.enhanced_wallets
            FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to insert enhanced wallets" ON public.enhanced_wallets
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to update enhanced wallets" ON public.enhanced_wallets
            FOR UPDATE USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to delete enhanced wallets" ON public.enhanced_wallets
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 7. FIX USER_PROFILES TABLE RLS (if it exists and is different from profiles)
-- Check if user_profiles table exists and is different from profiles
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view their own user profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Users can update their own user profile" ON public.user_profiles;
        DROP POLICY IF EXISTS "Admins can view all user profiles" ON public.user_profiles;
        DROP POLICY IF EXISTS "Admins can update all user profiles" ON public.user_profiles;
        DROP POLICY IF EXISTS "Admins can insert user profiles" ON public.user_profiles;
        DROP POLICY IF EXISTS "Admins can delete user profiles" ON public.user_profiles;
        DROP POLICY IF EXISTS "Office app can view all user profiles" ON public.user_profiles;
        DROP POLICY IF EXISTS "Office app can insert user profiles" ON public.user_profiles;
        DROP POLICY IF EXISTS "Office app can update user profiles" ON public.user_profiles;
        DROP POLICY IF EXISTS "Office app can delete user profiles" ON public.user_profiles;

        -- Create new permissive policies for user_profiles
        CREATE POLICY "Allow authenticated users to view user profiles" ON public.user_profiles
            FOR SELECT USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to insert user profiles" ON public.user_profiles
            FOR INSERT WITH CHECK (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to update user profiles" ON public.user_profiles
            FOR UPDATE USING (auth.role() = 'authenticated');

        CREATE POLICY "Allow authenticated users to delete user profiles" ON public.user_profiles
            FOR DELETE USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- 8. GRANT ADDITIONAL PERMISSIONS
-- Ensure all roles have proper table permissions
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

-- 9. VERIFY THE FIX
-- Check RLS status after fixes
SELECT 
    'RLS Status After Fix' as info,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'wallets', 'pickups', 'materials', 'enhanced_wallets', 'user_profiles')
ORDER BY tablename;

-- Check policies after fixes
SELECT 
    'Policies After Fix' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'wallets', 'pickups', 'materials', 'enhanced_wallets', 'user_profiles')
ORDER BY tablename, policyname;

-- 10. TEST ACCESS
-- Test that we can access the tables
SELECT 
    'Access Test Results' as info,
    'profiles' as table_name,
    COUNT(*) as record_count
FROM public.profiles
UNION ALL
SELECT 
    'Access Test Results' as info,
    'wallets' as table_name,
    COUNT(*) as record_count
FROM public.wallets
UNION ALL
SELECT 
    'Access Test Results' as info,
    'pickups' as table_name,
    COUNT(*) as record_count
FROM public.pickups
UNION ALL
SELECT 
    'Access Test Results' as info,
    'materials' as table_name,
    COUNT(*) as record_count
FROM public.materials;

-- Test enhanced_wallets if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enhanced_wallets' AND table_schema = 'public') THEN
        RAISE NOTICE 'Testing enhanced_wallets access...';
        PERFORM COUNT(*) FROM public.enhanced_wallets;
        RAISE NOTICE 'enhanced_wallets access successful';
    END IF;
END $$;

-- Test user_profiles if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles' AND table_schema = 'public') THEN
        RAISE NOTICE 'Testing user_profiles access...';
        PERFORM COUNT(*) FROM public.user_profiles;
        RAISE NOTICE 'user_profiles access successful';
    END IF;
END $$;

-- 11. FINAL STATUS REPORT
SELECT 
    '🎯 RLS FIX COMPLETE' as status,
    'Main app should now be able to access all required tables' as result,
    'Check your main app to verify it is working' as next_step;
