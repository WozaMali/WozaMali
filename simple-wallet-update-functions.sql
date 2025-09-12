-- Simple Wallet Update Functions for Main App
-- This script adds only the essential functions for wallet balance updates
-- No new tables or views needed - works with your existing structure

-- ============================================================================
-- 1. CREATE WALLET UPDATE FUNCTION
-- ============================================================================

-- Function to update wallet balance and points
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_user_id UUID,
    p_balance_change DECIMAL(10,2),
    p_points_change INTEGER,
    p_transaction_type TEXT,
    p_description TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_id UUID;
    v_new_balance DECIMAL(10,2);
    v_new_points INTEGER;
    v_new_tier TEXT;
BEGIN
    -- Get or create wallet
    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
    
    IF v_wallet_id IS NULL THEN
        INSERT INTO wallets (user_id, balance, total_points, tier)
        VALUES (p_user_id, 0, 0, 'bronze')
        RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Calculate new values
    SELECT 
        COALESCE(balance, 0) + p_balance_change,
        COALESCE(total_points, 0) + p_points_change
    INTO v_new_balance, v_new_points
    FROM wallets WHERE id = v_wallet_id;
    
    -- Calculate tier based on points
    v_new_tier := CASE
        WHEN v_new_points >= 1000 THEN 'platinum'
        WHEN v_new_points >= 500 THEN 'gold'
        WHEN v_new_points >= 200 THEN 'silver'
        ELSE 'bronze'
    END;
    
    -- Update wallet
    UPDATE wallets 
    SET 
        balance = v_new_balance,
        total_points = v_new_points,
        tier = v_new_tier,
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Record transaction
    INSERT INTO transactions (
        user_id, points, transaction_type, description
    ) VALUES (
        p_user_id, p_points_change, p_transaction_type, p_description
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. CREATE COLLECTION PAYMENT PROCESSING FUNCTION
-- ============================================================================

-- Function to process collection payment and update wallet
CREATE OR REPLACE FUNCTION process_collection_payment(
    p_collection_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_collection RECORD;
    v_calculated_value DECIMAL(10,2);
    v_calculated_points INTEGER;
BEGIN
    -- Get collection details
    SELECT 
        c.*,
        CASE
            WHEN c.material_type = 'Paper' THEN c.weight_kg * 0.80
            WHEN c.material_type = 'Plastic' THEN c.weight_kg * 1.50
            WHEN c.material_type = 'Glass' THEN c.weight_kg * 1.20
            WHEN c.material_type = 'Metal' THEN c.weight_kg * 18.55
            WHEN c.material_type = 'Cardboard' THEN c.weight_kg * 0.60
            ELSE c.weight_kg * 1.00
        END as calculated_value,
        CASE
            WHEN c.material_type = 'Paper' THEN FLOOR(c.weight_kg * 2)
            WHEN c.material_type = 'Plastic' THEN FLOOR(c.weight_kg * 3)
            WHEN c.material_type = 'Glass' THEN FLOOR(c.weight_kg * 2.5)
            WHEN c.material_type = 'Metal' THEN FLOOR(c.weight_kg * 4)
            WHEN c.material_type = 'Cardboard' THEN FLOOR(c.weight_kg * 1.5)
            ELSE FLOOR(c.weight_kg * 2)
        END as calculated_points
    INTO v_collection
    FROM collections c
    WHERE c.id = p_collection_id;
    
    IF v_collection.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Update wallet
    PERFORM update_wallet_balance(
        v_collection.user_id,
        v_collection.calculated_value,
        v_collection.calculated_points,
        'collection',
        'Collection payment for ' || v_collection.id
    );
    
    -- Update collection status to approved
    UPDATE collections 
    SET 
        status = 'approved',
        updated_at = NOW()
    WHERE id = p_collection_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. CREATE WALLET DATA FUNCTION
-- ============================================================================

-- Function to get comprehensive wallet data for a user
CREATE OR REPLACE FUNCTION get_wallet_data(p_user_id UUID)
RETURNS TABLE (
    wallet_id UUID,
    user_id UUID,
    full_name TEXT,
    email TEXT,
    phone TEXT,
    balance DECIMAL(10,2),
    total_points INTEGER,
    tier TEXT,
    total_earnings DECIMAL(10,2),
    total_weight_kg DECIMAL(10,2),
    total_collections BIGINT,
    recent_transactions BIGINT,
    last_updated TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.id as wallet_id,
        p.id as user_id,
        p.full_name,
        p.email,
        p.phone,
        COALESCE(w.balance, 0) as balance,
        COALESCE(w.total_points, 0) as total_points,
        COALESCE(w.tier, 'bronze') as tier,
        COALESCE(w.balance, 0) as total_earnings,
        COALESCE((
            SELECT SUM(c.weight_kg) 
            FROM collections c 
            WHERE c.user_id = p.id AND c.status = 'approved'
        ), 0) as total_weight_kg,
        COALESCE((
            SELECT COUNT(*) 
            FROM collections c 
            WHERE c.user_id = p.id
        ), 0) as total_collections,
        COALESCE((
            SELECT COUNT(*) 
            FROM transactions t 
            WHERE t.user_id = p.id 
            AND t.created_at > NOW() - INTERVAL '7 days'
        ), 0) as recent_transactions,
        COALESCE(w.updated_at, w.created_at) as last_updated
    FROM profiles p
    LEFT JOIN wallets w ON p.id = w.user_id
    WHERE p.id = p_user_id AND p.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION update_wallet_balance TO authenticated;
GRANT EXECUTE ON FUNCTION process_collection_payment TO authenticated;
GRANT EXECUTE ON FUNCTION get_wallet_data TO authenticated;

-- ============================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_updated_at ON wallets(updated_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================

-- Now you can use these functions in your Main App:

-- 1. Get wallet data for a user:
-- SELECT * FROM get_wallet_data('user-id-here');

-- 2. Update wallet balance:
-- SELECT update_wallet_balance('user-id-here', 50.00, 50, 'collection', 'Recycling reward');

-- 3. Process collection payment:
-- SELECT process_collection_payment('collection-id-here');

-- 4. Read wallet data directly from wallets table:
-- SELECT * FROM wallets WHERE user_id = 'user-id-here';
