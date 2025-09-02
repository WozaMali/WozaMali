-- Temporarily disable RLS on all tables
-- Run this in your Supabase SQL Editor to get the app working immediately

-- Disable RLS on all tables
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickups DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_scholar_fund DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'user_profiles', 'addresses', 'wallets', 'materials', 
  'pickups', 'pickup_items', 'pickup_photos', 'payments',
  'rewards', 'withdrawals', 'green_scholar_fund'
)
ORDER BY tablename;

-- Test connection
SELECT COUNT(*) FROM public.user_profiles LIMIT 1;
