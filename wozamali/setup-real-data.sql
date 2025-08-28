-- Quick Setup for Real Wallet Data in WozaMali
-- Run this in your Supabase SQL Editor to get real wallet data

-- Step 1: Create the enhanced_wallets table if it doesn't exist
CREATE TABLE IF NOT EXISTS enhanced_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    external_wallet_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add unique constraint
ALTER TABLE enhanced_wallets ADD CONSTRAINT IF NOT EXISTS enhanced_wallets_user_id_key UNIQUE (user_id);

-- Step 3: Insert real wallet data for testing
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from authentication
INSERT INTO enhanced_wallets (user_id, balance, total_points, tier, sync_status)
VALUES 
    ('YOUR_USER_ID_HERE', 250.75, 125, 'silver', 'synced')
ON CONFLICT (user_id) 
DO UPDATE SET 
    balance = 250.75,
    total_points = 125,
    tier = 'silver',
    sync_status = 'synced',
    updated_at = NOW();

-- Step 4: Create a simple view for wallet balance
CREATE OR REPLACE VIEW customer_wallet_balance_view AS
SELECT 
    user_id,
    balance,
    total_points,
    tier,
    sync_status,
    created_at,
    updated_at
FROM enhanced_wallets;

-- Step 5: Verify the data
SELECT * FROM enhanced_wallets;
SELECT * FROM customer_wallet_balance_view;
