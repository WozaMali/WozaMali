-- Automatic Wallet Setup for WozaMali
-- This script automatically finds the current user and sets up their wallet
-- Run this in Supabase SQL Editor - no manual user ID needed!

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

-- Step 3: Create a function to automatically set up wallet for any user
CREATE OR REPLACE FUNCTION auto_setup_user_wallet(
    user_email TEXT DEFAULT NULL,
    target_balance DECIMAL(10,2) DEFAULT 250.75,
    target_points INTEGER DEFAULT 125,
    target_tier TEXT DEFAULT 'silver'
)
RETURNS TEXT AS $$
DECLARE
    found_user_id UUID;
    result_message TEXT;
BEGIN
    -- Find user by email if provided, otherwise get the most recent user
    IF user_email IS NOT NULL THEN
        SELECT id INTO found_user_id 
        FROM auth.users 
        WHERE email = user_email;
    ELSE
        -- Get the most recent user (usually the one who just signed up)
        SELECT id INTO found_user_id 
        FROM auth.users 
        ORDER BY created_at DESC 
        LIMIT 1;
    END IF;
    
    -- Check if user was found
    IF found_user_id IS NULL THEN
        RETURN 'No user found. Please provide a valid email or ensure users exist.';
    END IF;
    
    -- Insert or update wallet data
    INSERT INTO enhanced_wallets (user_id, balance, total_points, tier, sync_status)
    VALUES (found_user_id, target_balance, target_points, target_tier, 'synced')
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = target_balance,
        total_points = target_points,
        tier = target_tier,
        sync_status = 'synced',
        updated_at = NOW();
    
    -- Create the wallet balance view
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
    
    -- Return success message with user info
    SELECT 
        'Wallet setup complete for user: ' || email || ' (ID: ' || found_user_id || '). ' ||
        'Balance: R' || target_balance || ', Points: ' || target_points || ', Tier: ' || target_tier
    INTO result_message
    FROM auth.users 
    WHERE id = found_user_id;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Automatically set up wallet for the most recent user
SELECT auto_setup_user_wallet();

-- Step 5: Show all users and their wallet status
SELECT 
    u.email,
    u.created_at,
    COALESCE(w.balance, 0) as wallet_balance,
    COALESCE(w.total_points, 0) as points,
    COALESCE(w.tier, 'none') as tier,
    CASE WHEN w.id IS NOT NULL THEN '✅ Wallet Created' ELSE '❌ No Wallet' END as status
FROM auth.users u
LEFT JOIN enhanced_wallets w ON u.id = w.user_id
ORDER BY u.created_at DESC;

-- Step 6: Show the wallet balance view
SELECT * FROM customer_wallet_balance_view;
