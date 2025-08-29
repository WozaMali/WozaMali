-- WozaMali Wallet Points Fix Script
-- Run this in your Supabase SQL Editor to fix the wallet points issue

-- 1. First, let's check what we have
SELECT 'Current State' as info;
SELECT 
  COUNT(*) as wallets_count,
  COUNT(CASE WHEN total_points > 0 THEN 1 END) as wallets_with_points,
  COUNT(CASE WHEN balance > 0 THEN 1 END) as wallets_with_balance
FROM public.wallets;

-- 2. Create pickups table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.pickups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  weight_kg DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  pickup_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  total_pickups INTEGER DEFAULT 0,
  approved_pickups INTEGER DEFAULT 0,
  pending_pickups INTEGER DEFAULT 0,
  rejected_pickups INTEGER DEFAULT 0,
  total_weight_kg DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Enable RLS on new tables
ALTER TABLE public.pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_metrics ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for pickups
DROP POLICY IF EXISTS "Users can view their own pickups" ON public.pickups;
CREATE POLICY "Users can view their own pickups" ON public.pickups
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own pickups" ON public.pickups;
CREATE POLICY "Users can insert their own pickups" ON public.pickups
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create RLS policies for user_metrics
DROP POLICY IF EXISTS "Users can view their own metrics" ON public.user_metrics;
CREATE POLICY "Users can view their own metrics" ON public.user_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- 7. Insert sample pickup data for existing users (if they don't have any)
INSERT INTO public.pickups (user_id, weight_kg, status, pickup_date)
SELECT 
  w.user_id,
  15.5, -- Sample weight
  'approved',
  CURRENT_DATE - INTERVAL '7 days'
FROM public.wallets w
WHERE NOT EXISTS (
  SELECT 1 FROM public.pickups p WHERE p.user_id = w.user_id
)
LIMIT 5;

-- 8. Insert or update user metrics for existing users
INSERT INTO public.user_metrics (user_id, total_pickups, approved_pickups, total_weight_kg)
SELECT 
  w.user_id,
  COALESCE(p.pickup_count, 0),
  COALESCE(p.approved_count, 0),
  COALESCE(p.total_weight, 0)
FROM public.wallets w
LEFT JOIN (
  SELECT 
    user_id,
    COUNT(*) as pickup_count,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    SUM(weight_kg) as total_weight
  FROM public.pickups
  GROUP BY user_id
) p ON w.user_id = p.user_id
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_metrics um WHERE um.user_id = w.user_id
)
ON CONFLICT (user_id) DO UPDATE SET
  total_pickups = EXCLUDED.total_pickups,
  approved_pickups = EXCLUDED.approved_pickups,
  total_weight_kg = EXCLUDED.total_weight_kg,
  updated_at = NOW();

-- 9. Update wallet total_points based on actual recycled weight
UPDATE public.wallets 
SET 
  total_points = COALESCE(um.total_weight_kg, 0),
  updated_at = NOW()
FROM public.user_metrics um
WHERE wallets.user_id = um.user_id
  AND um.total_weight_kg > 0;

-- 10. Update wallet balance based on points (1 point = R0.10)
UPDATE public.wallets 
SET 
  balance = COALESCE(total_points * 0.10, 0),
  updated_at = NOW()
WHERE total_points > 0;

-- 11. Update wallet tiers based on total_points
UPDATE public.wallets 
SET 
  tier = CASE 
    WHEN total_points >= 100 THEN 'platinum'
    WHEN total_points >= 50 THEN 'gold'
    WHEN total_points >= 20 THEN 'silver'
    ELSE 'bronze'
  END,
  updated_at = NOW();

-- 12. Verify the fix worked
SELECT 'After Fix' as info;
SELECT 
  w.user_id,
  p.email,
  w.balance,
  w.total_points,
  w.tier,
  um.total_weight_kg,
  um.approved_pickups
FROM public.wallets w
LEFT JOIN public.profiles p ON w.user_id = p.id
LEFT JOIN public.user_metrics um ON w.user_id = um.user_id
ORDER BY w.total_points DESC
LIMIT 10;

-- 13. Show summary
SELECT 
  'Fix Summary' as summary,
  COUNT(*) as total_wallets,
  COUNT(CASE WHEN total_points > 0 THEN 1 END) as wallets_with_points,
  COUNT(CASE WHEN balance > 0 THEN 1 END) as wallets_with_balance,
  ROUND(AVG(total_points), 2) as avg_points,
  ROUND(AVG(balance), 2) as avg_balance
FROM public.wallets;
