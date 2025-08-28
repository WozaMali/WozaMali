-- Quick Wallet Setup for WozaMali
-- Run this in your Supabase SQL Editor to fix balance display issues

-- 1. Create wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 50.00,
    total_points INTEGER DEFAULT 50,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create enhanced_wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.enhanced_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) DEFAULT 50.00,
    total_points INTEGER DEFAULT 50,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    sync_status TEXT DEFAULT 'synced',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable Row Level Security
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enhanced_wallets ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for wallets table
DROP POLICY IF EXISTS "Users can view own wallet" ON public.wallets;
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own wallet" ON public.wallets;
CREATE POLICY "Users can update own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own wallet" ON public.wallets;
CREATE POLICY "Users can insert own wallet" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Create RLS policies for enhanced_wallets table
DROP POLICY IF EXISTS "Users can view own enhanced wallet" ON public.enhanced_wallets;
CREATE POLICY "Users can view own enhanced wallet" ON public.enhanced_wallets
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own enhanced wallet" ON public.enhanced_wallets;
CREATE POLICY "Users can update own enhanced wallet" ON public.enhanced_wallets
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own enhanced wallet" ON public.enhanced_wallets;
CREATE POLICY "Users can insert own enhanced wallet" ON public.enhanced_wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 6. Create function to automatically create wallet for new users
CREATE OR REPLACE FUNCTION public.handle_new_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to insert into wallets table first
    BEGIN
        INSERT INTO public.wallets (user_id, balance, total_points, tier)
        VALUES (NEW.id, 50.00, 50, 'bronze');
    EXCEPTION
        WHEN OTHERS THEN
            -- If wallets table fails, try enhanced_wallets
            INSERT INTO public.enhanced_wallets (user_id, balance, total_points, tier, sync_status)
            VALUES (NEW.id, 50.00, 50, 'bronze', 'synced');
    END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create trigger to create wallet when profile is created
DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_wallet();

-- 8. Create wallets for existing users who don't have them
INSERT INTO public.wallets (user_id, balance, total_points, tier, created_at, updated_at)
SELECT 
    p.id,
    50.00,
    50,
    'bronze',
    NOW(),
    NOW()
FROM public.profiles p
LEFT JOIN public.wallets w ON p.id = w.user_id
WHERE w.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 9. Create enhanced wallets for existing users who don't have them
INSERT INTO public.enhanced_wallets (user_id, balance, total_points, tier, sync_status, created_at, updated_at)
SELECT 
    p.id,
    50.00,
    50,
    'bronze',
    'synced',
    NOW(),
    NOW()
FROM public.profiles p
LEFT JOIN public.enhanced_wallets ew ON p.id = ew.user_id
WHERE ew.id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- 10. Add unique constraints to prevent duplicate wallets per user
DO $$ 
BEGIN
    -- Add unique constraint to wallets table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'wallets_user_id_key' 
        AND conrelid = 'public.wallets'::regclass
    ) THEN
        ALTER TABLE public.wallets ADD CONSTRAINT wallets_user_id_key UNIQUE (user_id);
    END IF;
    
    -- Add unique constraint to enhanced_wallets table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'enhanced_wallets_user_id_key' 
        AND conrelid = 'public.enhanced_wallets'::regclass
    ) THEN
        ALTER TABLE public.enhanced_wallets ADD CONSTRAINT enhanced_wallets_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 11. Create indexes for performance
DO $$ 
BEGIN
    -- Create index on wallets table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_wallets_user_id' 
        AND tablename = 'wallets'
    ) THEN
        CREATE INDEX idx_wallets_user_id ON public.wallets(user_id);
    END IF;
    
    -- Create index on enhanced_wallets table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_enhanced_wallets_user_id' 
        AND tablename = 'enhanced_wallets'
    ) THEN
        CREATE INDEX idx_enhanced_wallets_user_id ON public.enhanced_wallets(user_id);
    END IF;
END $$;

-- 12. Show results
SELECT 
    'Setup Complete' as status,
    (SELECT COUNT(*) FROM public.wallets) as wallets_count,
    (SELECT COUNT(*) FROM public.enhanced_wallets) as enhanced_wallets_count,
    (SELECT COUNT(*) FROM public.profiles) as profiles_count;

-- 13. Show sample wallet data
SELECT 
    'Sample Wallets' as info,
    w.user_id,
    w.balance,
    w.total_points,
    w.tier
FROM public.wallets w
LIMIT 5;
