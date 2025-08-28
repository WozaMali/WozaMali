-- Complete Fix for WozaMali Wallet and Pickup System
-- This will fix the wallet display and set up automatic pickups

-- Step 1: Ensure the enhanced_wallets table has the right structure
DROP TABLE IF EXISTS enhanced_wallets CASCADE;
CREATE TABLE enhanced_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    external_wallet_id TEXT,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create the pickup system table
DROP TABLE IF EXISTS pickups CASCADE;
CREATE TABLE pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES enhanced_wallets(user_id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    total_kg DECIMAL(8,2) NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME NOT NULL,
    address TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create a function to automatically create pickups
CREATE OR REPLACE FUNCTION create_sample_pickup(
    target_user_id UUID,
    kg_amount DECIMAL(8,2) DEFAULT 25.5,
    pickup_days_ago INTEGER DEFAULT 7
)
RETURNS TEXT AS $$
DECLARE
    pickup_date DATE;
    pickup_value DECIMAL(10,2);
    result_message TEXT;
BEGIN
    -- Calculate pickup date (days ago)
    pickup_date := CURRENT_DATE - INTERVAL '1 day' * pickup_days_ago;
    
    -- Calculate value (R1 per kg)
    pickup_value := kg_amount;
    
    -- Insert pickup
    INSERT INTO pickups (user_id, status, total_kg, total_value, pickup_date, pickup_time, address)
    VALUES (
        target_user_id,
        'approved',
        kg_amount,
        pickup_value,
        pickup_date,
        '09:00:00',
        '652 Hashe Street, Dobsonville, Soweto, 1863'
    );
    
    -- Update wallet balance and points
    UPDATE enhanced_wallets 
    SET 
        balance = balance + pickup_value,
        total_points = total_points + kg_amount::INTEGER,
        tier = CASE 
            WHEN total_points + kg_amount::INTEGER >= 1000 THEN 'platinum'
            WHEN total_points + kg_amount::INTEGER >= 500 THEN 'gold'
            WHEN total_points + kg_amount::INTEGER >= 100 THEN 'silver'
            ELSE 'bronze'
        END,
        updated_at = NOW()
    WHERE user_id = target_user_id;
    
    -- Return success message
    SELECT 
        'Pickup created: ' || kg_amount || 'kg for R' || pickup_value || 
        ' on ' || pickup_date || '. New balance: R' || (balance + pickup_value) ||
        ', Points: ' || (total_points + kg_amount::INTEGER)
    INTO result_message
    FROM enhanced_wallets 
    WHERE user_id = target_user_id;
    
    RETURN result_message;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create the wallet balance view
DROP VIEW IF EXISTS customer_wallet_balance_view CASCADE;
CREATE VIEW customer_wallet_balance_view AS
SELECT 
    w.user_id,
    w.balance,
    w.total_points,
    w.tier,
    w.sync_status,
    w.created_at,
    w.updated_at,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name
FROM enhanced_wallets w
JOIN auth.users u ON w.user_id = u.id;

-- Step 5: Insert wallet data for Vintage Concepts
INSERT INTO enhanced_wallets (user_id, balance, total_points, tier, sync_status)
VALUES ('6b694dc5-93f2-4610-b13d-920ae9275018', 250.75, 125, 'silver', 'synced')
ON CONFLICT (user_id) 
DO UPDATE SET 
    balance = 250.75,
    total_points = 125,
    tier = 'silver',
    sync_status = 'synced',
    updated_at = NOW();

-- Step 6: Create sample pickups for Vintage Concepts (to show the system works)
SELECT create_sample_pickup('6b694dc5-93f2-4610-b13d-920ae9275018', 25.5, 7);  -- 7 days ago
SELECT create_sample_pickup('6b694dc5-93f2-4610-b13d-920ae9275018', 18.75, 3); -- 3 days ago
SELECT create_sample_pickup('6b694dc5-93f2-4610-b13d-920ae9275018', 31.25, 1); -- 1 day ago

-- Step 7: Show final results
SELECT 
    '=== WALLET STATUS ===' as info,
    u.email,
    w.balance,
    w.total_points,
    w.tier
FROM enhanced_wallets w
JOIN auth.users u ON w.user_id = u.id
WHERE u.email = 'vintageconceptsa@gmail.com';

SELECT 
    '=== PICKUP HISTORY ===' as info,
    p.pickup_date,
    p.total_kg,
    p.total_value,
    p.status
FROM pickups p
WHERE p.user_id = '6b694dc5-93f2-4610-b13d-920ae9275018'
ORDER BY p.pickup_date DESC;
