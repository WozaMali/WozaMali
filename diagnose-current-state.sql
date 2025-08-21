-- =====================================================
-- DIAGNOSE CURRENT DATABASE STATE
-- Run this to see what's currently in your database
-- =====================================================

-- Check what tables currently exist
SELECT 
    'Current Tables' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check if the main tables exist
SELECT 
    'Required Tables Check' as info,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN '✅ EXISTS' ELSE '❌ MISSING' END as profiles,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offices') THEN '✅ EXISTS' ELSE '❌ MISSING' END as offices,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_areas') THEN '✅ EXISTS' ELSE '❌ MISSING' END as collection_areas,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') THEN '✅ EXISTS' ELSE '❌ MISSING' END as wallets;

-- Check if backup tables exist
SELECT 
    'Backup Tables Check' as info,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles_backup') THEN '✅ EXISTS' ELSE '❌ MISSING' END as profiles_backup,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets_backup') THEN '✅ EXISTS' ELSE '❌ MISSING' END as wallets_backup,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_areas_backup') THEN '✅ EXISTS' ELSE '❌ MISSING' END as collection_areas_backup;

-- Check extensions
SELECT 
    'Extensions Check' as info,
    CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN '✅ EXISTS' ELSE '❌ MISSING' END as uuid_ossp,
    CASE WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN '✅ EXISTS' ELSE '❌ MISSING' END as pg_cron;

-- Check if there are any errors in recent logs (if accessible)
SELECT 
    'Database Status' as info,
    CASE 
        WHEN (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') > 0 
        THEN 'Tables exist - Schema may be partially installed'
        ELSE 'No tables found - Schema not installed'
    END as status;

-- Show any existing data
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        RAISE NOTICE 'Profiles table exists with % rows', (SELECT COUNT(*) FROM public.profiles);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'offices') THEN
        RAISE NOTICE 'Offices table exists with % rows', (SELECT COUNT(*) FROM public.offices);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallets') THEN
        RAISE NOTICE 'Wallets table exists with % rows', (SELECT COUNT(*) FROM public.wallets);
    END IF;
END $$;
