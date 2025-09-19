-- ============================================================================
-- REWARDS TABLE SETUP FOR WOZA MALI OFFICE APP (WITH CLEANUP)
-- ============================================================================
-- This script creates the missing rewards table that the rewardsService.ts expects
-- Run this in your Supabase SQL Editor to fix the 404 error

-- Create the rewards table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_rewards_category ON public.rewards(category);
CREATE INDEX IF NOT EXISTS idx_rewards_is_active ON public.rewards(is_active);
CREATE INDEX IF NOT EXISTS idx_rewards_points_required ON public.rewards(points_required);

-- Enable Row Level Security
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Allow all authenticated users to read rewards
CREATE POLICY "Allow authenticated users to read rewards" ON public.rewards
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow only office/admin users to insert, update, delete rewards
CREATE POLICY "Allow office users to manage rewards" ON public.rewards
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role_id IN ('office', 'admin')
        )
    );

-- Create trigger function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_rewards_updated_at 
    BEFORE UPDATE ON public.rewards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample rewards data for testing
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

-- Verify the table was created successfully
SELECT 'Rewards table created successfully!' as status;
SELECT COUNT(*) as total_rewards FROM public.rewards;
