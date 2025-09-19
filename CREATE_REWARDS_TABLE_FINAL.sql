-- ============================================================================
-- CREATE REWARDS TABLE - FINAL VERSION
-- ============================================================================
-- Run this script in your Supabase SQL Editor
-- This creates the rewards table with proper RLS policies

-- Step 1: Create the rewards table
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL CHECK (points_required >= 0),
    category TEXT NOT NULL CHECK (category IN ('cash', 'service', 'product', 'voucher')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rewards_category ON public.rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON public.rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_rewards_points_required ON public.rewards(points_required);

-- Step 3: Enable Row Level Security
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop any existing policies (in case they exist)
DROP POLICY IF EXISTS "Allow authenticated users to read rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow office users to manage rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow admin and office users to manage rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow all authenticated users to manage rewards" ON public.rewards;

-- Step 5: Create RLS policies
-- Allow all authenticated users to read rewards
CREATE POLICY "Allow authenticated users to read rewards" ON public.rewards
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow all authenticated users to manage rewards (for now - can be restricted later)
CREATE POLICY "Allow all authenticated users to manage rewards" ON public.rewards
    FOR ALL
    TO authenticated
    USING (true);

-- Step 6: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS update_rewards_updated_at ON public.rewards;
CREATE TRIGGER update_rewards_updated_at
    BEFORE UPDATE ON public.rewards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Insert sample data for testing
INSERT INTO public.rewards (name, description, points_required, category, is_active) VALUES
('R50 Cash Back', 'Get R50 cash back to your wallet', 500, 'cash', true),
('R100 Cash Back', 'Get R100 cash back to your wallet', 1000, 'cash', true),
('R200 Cash Back', 'Get R200 cash back to your wallet', 2000, 'cash', true),
('Free Collection Service', 'One free waste collection service', 300, 'service', true),
('Premium Collection Service', 'Priority waste collection service', 500, 'service', true),
('Eco-Friendly Water Bottle', 'Reusable stainless steel water bottle', 800, 'product', true),
('Recycling Kit', 'Complete home recycling starter kit', 1200, 'product', true),
('R50 Voucher', 'R50 voucher for local grocery store', 600, 'voucher', true),
('R100 Voucher', 'R100 voucher for local grocery store', 1200, 'voucher', true),
('R200 Voucher', 'R200 voucher for local grocery store', 2400, 'voucher', true)
ON CONFLICT (id) DO NOTHING;

-- Step 9: Verify the table was created
SELECT 'Rewards table created successfully!' as status;
SELECT COUNT(*) as total_rewards FROM public.rewards;
SELECT name, points_required, category FROM public.rewards LIMIT 5;
