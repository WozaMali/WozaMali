-- Migration Script: Transition to Unified Wallet Schema
-- This script helps migrate from existing schemas to the unified wallet system

-- ============================================================================
-- STEP 1: BACKUP EXISTING DATA (if needed)
-- ============================================================================

-- Create backup tables for existing data
CREATE TABLE IF NOT EXISTS wallets_backup AS SELECT * FROM wallets;
CREATE TABLE IF NOT EXISTS wallet_transactions_backup AS SELECT * FROM wallet_transactions;
CREATE TABLE IF NOT EXISTS points_history_backup AS SELECT * FROM points_history;

-- ============================================================================
-- STEP 2: CREATE USER PROFILES TABLE (if not exists)
-- ============================================================================

-- Create user_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'collector', 'office', 'admin')),
    area_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ============================================================================
-- STEP 3: MIGRATE USER DATA TO USER_PROFILES
-- ============================================================================

-- Insert users from auth.users into user_profiles if they don't exist
INSERT INTO user_profiles (user_id, full_name, email, role, is_active)
SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'full_name', au.email, 'Unknown User'),
    au.email,
    COALESCE(au.raw_user_meta_data->>'role', 'resident'),
    true
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM user_profiles up WHERE up.user_id = au.id
);

-- ============================================================================
-- STEP 4: CREATE ENHANCED WALLETS TABLE
-- ============================================================================

-- Create the new enhanced wallets table
CREATE TABLE IF NOT EXISTS wallets_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_points INTEGER NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_weight_kg DECIMAL(10,2) DEFAULT 0.00,
    environmental_impact JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- ============================================================================
-- STEP 5: MIGRATE WALLET DATA
-- ============================================================================

-- Migrate existing wallet data to new structure
INSERT INTO wallets_new (user_id, balance, total_points, tier, total_earnings, last_updated, created_at, updated_at)
SELECT 
    up.id,
    COALESCE(w.balance, 0),
    COALESCE(w.total_points, 0),
    COALESCE(w.tier, 'bronze'),
    COALESCE(w.balance, 0), -- Use balance as total_earnings for now
    COALESCE(w.updated_at, w.created_at, NOW()),
    COALESCE(w.created_at, NOW()),
    COALESCE(w.updated_at, NOW())
FROM user_profiles up
LEFT JOIN wallets w ON up.user_id = w.user_id
WHERE NOT EXISTS (
    SELECT 1 FROM wallets_new wn WHERE wn.user_id = up.id
);

-- ============================================================================
-- STEP 6: CREATE ENHANCED TRANSACTIONS TABLE
-- ============================================================================

-- Create new wallet transactions table
CREATE TABLE IF NOT EXISTS wallet_transactions_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets_new(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('collection', 'withdrawal', 'transfer', 'reward', 'penalty', 'bonus', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    points_spent INTEGER DEFAULT 0,
    balance_after DECIMAL(10,2) NOT NULL,
    points_after INTEGER NOT NULL,
    description TEXT,
    reference_id UUID,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 7: MIGRATE TRANSACTION DATA
-- ============================================================================

-- Migrate existing wallet transactions
INSERT INTO wallet_transactions_new (
    wallet_id, user_id, transaction_type, amount, 
    points_earned, points_spent, balance_after, points_after,
    description, reference_id, status, created_at
)
SELECT 
    wn.id,
    up.id,
    wt.transaction_type,
    wt.amount,
    COALESCE(wt.points_earned, 0),
    COALESCE(wt.points_spent, 0),
    wn.balance, -- Use current balance as balance_after
    wn.total_points, -- Use current points as points_after
    wt.description,
    wt.reference_id,
    COALESCE(wt.status, 'completed'),
    COALESCE(wt.created_at, NOW())
FROM wallet_transactions wt
JOIN wallets w ON wt.wallet_id = w.id
JOIN user_profiles up ON w.user_id = up.user_id
JOIN wallets_new wn ON up.id = wn.user_id
WHERE NOT EXISTS (
    SELECT 1 FROM wallet_transactions_new wtn WHERE wtn.id = wt.id
);

-- ============================================================================
-- STEP 8: CREATE POINTS HISTORY TABLE
-- ============================================================================

-- Create new points history table
CREATE TABLE IF NOT EXISTS points_history_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets_new(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('recycling', 'referral', 'bonus', 'redemption', 'penalty', 'adjustment')),
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Migrate existing points history if it exists
INSERT INTO points_history_new (
    user_id, wallet_id, points_change, activity_type, 
    description, reference_id, created_at
)
SELECT 
    up.id,
    wn.id,
    ph.points_change,
    ph.activity_type,
    ph.description,
    ph.reference_id,
    COALESCE(ph.created_at, NOW())
FROM points_history ph
JOIN wallets w ON ph.wallet_id = w.id
JOIN user_profiles up ON w.user_id = up.user_id
JOIN wallets_new wn ON up.id = wn.user_id
WHERE NOT EXISTS (
    SELECT 1 FROM points_history_new phn WHERE phn.id = ph.id
);

-- ============================================================================
-- STEP 9: CREATE MATERIALS TABLE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    rate_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    points_per_kg INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default materials if none exist
INSERT INTO materials (id, name, category, rate_per_kg, points_per_kg) VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', 'Aluminum Cans', 'Metal', 15.50, 15),
    ('660e8400-e29b-41d4-a716-446655440002', 'Plastic Bottles', 'Plastic', 8.75, 8),
    ('660e8400-e29b-41d4-a716-446655440003', 'Cardboard', 'Paper', 3.25, 3),
    ('660e8400-e29b-41d4-a716-446655440004', 'Glass Bottles', 'Glass', 2.50, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 10: CREATE COLLECTIONS SYSTEM
-- ============================================================================

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    pickup_address_id UUID,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE,
    scheduled_time TIME,
    total_kg DECIMAL(10,2) DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collection items table
CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(8,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    points_per_kg INTEGER NOT NULL DEFAULT 0,
    points_earned INTEGER GENERATED ALWAYS AS (quantity * points_per_kg) STORED,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 11: CREATE LIVE WALLET DATA VIEW
-- ============================================================================

-- Create live wallet data view
CREATE OR REPLACE VIEW live_wallet_data AS
SELECT 
    w.id as wallet_id,
    w.user_id,
    up.full_name,
    up.email,
    up.phone,
    w.balance,
    w.total_points,
    w.tier,
    w.total_earnings,
    w.total_weight_kg,
    w.environmental_impact,
    w.last_updated,
    -- Recent activity
    (SELECT COUNT(*) FROM wallet_transactions_new wt WHERE wt.wallet_id = w.id AND wt.created_at > NOW() - INTERVAL '7 days') as recent_transactions,
    -- Next tier info
    CASE 
        WHEN w.tier = 'bronze' THEN 'silver'
        WHEN w.tier = 'silver' THEN 'gold'
        WHEN w.tier = 'gold' THEN 'platinum'
        ELSE NULL
    END as next_tier,
    CASE 
        WHEN w.tier = 'bronze' THEN 200 - w.total_points
        WHEN w.tier = 'silver' THEN 500 - w.total_points
        WHEN w.tier = 'gold' THEN 1000 - w.total_points
        ELSE 0
    END as points_to_next_tier
FROM wallets_new w
JOIN user_profiles up ON w.user_id = up.id
WHERE up.is_active = true;

-- ============================================================================
-- STEP 12: CREATE WALLET UPDATE FUNCTIONS
-- ============================================================================

-- Function to update wallet balance and points
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_user_id UUID,
    p_balance_change DECIMAL(10,2),
    p_points_change INTEGER,
    p_transaction_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_id UUID;
    v_new_balance DECIMAL(10,2);
    v_new_points INTEGER;
    v_new_tier TEXT;
BEGIN
    -- Get or create wallet
    SELECT id INTO v_wallet_id FROM wallets_new WHERE user_id = p_user_id;
    
    IF v_wallet_id IS NULL THEN
        INSERT INTO wallets_new (user_id, balance, total_points)
        VALUES (p_user_id, 0, 0)
        RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Calculate new values
    SELECT 
        balance + p_balance_change,
        total_points + p_points_change
    INTO v_new_balance, v_new_points
    FROM wallets_new WHERE id = v_wallet_id;
    
    -- Calculate tier based on points
    v_new_tier := CASE
        WHEN v_new_points >= 1000 THEN 'platinum'
        WHEN v_new_points >= 500 THEN 'gold'
        WHEN v_new_points >= 200 THEN 'silver'
        ELSE 'bronze'
    END;
    
    -- Update wallet
    UPDATE wallets_new 
    SET 
        balance = v_new_balance,
        total_points = v_new_points,
        tier = v_new_tier,
        last_updated = NOW(),
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Record transaction
    INSERT INTO wallet_transactions_new (
        wallet_id, user_id, transaction_type, amount, 
        points_earned, points_spent, balance_after, points_after,
        description, reference_id
    ) VALUES (
        v_wallet_id, p_user_id, p_transaction_type, p_balance_change,
        CASE WHEN p_points_change > 0 THEN p_points_change ELSE 0 END,
        CASE WHEN p_points_change < 0 THEN ABS(p_points_change) ELSE 0 END,
        v_new_balance, v_new_points, p_description, p_reference_id
    );
    
    -- Record points history if points changed
    IF p_points_change != 0 THEN
        INSERT INTO points_history_new (
            user_id, wallet_id, points_change, activity_type, 
            description, reference_id
        ) VALUES (
            p_user_id, v_wallet_id, p_points_change, p_transaction_type,
            p_description, p_reference_id
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 13: ENABLE ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history_new ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 14: CREATE RLS POLICIES
-- ============================================================================

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (user_id = auth.uid());

-- Wallet policies
CREATE POLICY "Users can view own wallet" ON wallets_new
    FOR SELECT USING (user_id = auth.uid());

-- Transaction policies
CREATE POLICY "Users can view own transactions" ON wallet_transactions_new
    FOR SELECT USING (user_id = auth.uid());

-- Collections policies
CREATE POLICY "Users can view own collections" ON collections
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create collections" ON collections
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- STEP 15: GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON live_wallet_data TO authenticated;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- The migration is now complete. You can:
-- 1. Test the new system with the live_wallet_data view
-- 2. Update your main app to use the new UnifiedWalletService
-- 3. Once confirmed working, you can drop the old tables:
--    DROP TABLE IF EXISTS wallets CASCADE;
--    DROP TABLE IF EXISTS wallet_transactions CASCADE;
--    DROP TABLE IF EXISTS points_history CASCADE;
-- 4. Rename the new tables to the original names if needed


