-- WozaMali Wallet Issue Diagnostic Script
-- Run this in your Supabase SQL Editor to diagnose the wallet points issue

-- 1. Check what tables exist
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%wallet%' 
  OR tablename LIKE '%pickup%'
  OR tablename LIKE '%metric%'
ORDER BY tablename;

-- 2. Check wallets table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'wallets'
ORDER BY ordinal_position;

-- 3. Check if enhanced_wallets table exists
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'enhanced_wallets'
ORDER BY ordinal_position;

-- 4. Check sample wallet data
SELECT 
  w.id,
  w.user_id,
  w.balance,
  w.total_points,
  w.tier,
  p.email,
  p.full_name
FROM public.wallets w
LEFT JOIN public.profiles p ON w.user_id = p.id
ORDER BY w.created_at DESC
LIMIT 10;

-- 5. Check if pickups table exists and has data
SELECT 
  COUNT(*) as pickup_count,
  SUM(weight_kg) as total_weight,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count
FROM public.pickups
WHERE user_id IN (
  SELECT user_id FROM public.wallets LIMIT 5
);

-- 6. Check if user_metrics table exists and has data
SELECT 
  COUNT(*) as metrics_count,
  SUM(total_pickups) as total_pickups,
  SUM(approved_pickups) as total_approved
FROM public.user_metrics
WHERE user_id IN (
  SELECT user_id FROM public.wallets LIMIT 5
);

-- 7. Check for any recent activity
SELECT 
  'Recent Activity' as info,
  COUNT(*) as total_records
FROM (
  SELECT created_at FROM public.wallets
  UNION ALL
  SELECT created_at FROM public.profiles
  UNION ALL
  SELECT created_at FROM public.pickups
  UNION ALL
  SELECT created_at FROM public.user_metrics
) recent_activity
WHERE created_at > NOW() - INTERVAL '7 days';

-- 8. Check RLS policies
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN 'RLS Enabled'
    ELSE 'RLS Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('wallets', 'pickups', 'user_metrics', 'profiles');

-- 9. Check for any errors in recent logs (if available)
-- This will show if there are any database errors
SELECT 
  'Database Status' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.wallets) THEN '✅ Wallets table has data'
    ELSE '❌ Wallets table is empty'
  END as wallets_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.pickups) THEN '✅ Pickups table has data'
    ELSE '❌ Pickups table is empty'
  END as pickups_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.user_metrics) THEN '✅ User metrics table has data'
    ELSE '❌ User metrics table is empty'
  END as metrics_status;
