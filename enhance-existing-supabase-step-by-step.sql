-- Enhance Existing Supabase Database for Live Data Access (STEP BY STEP)
-- Run each section separately to avoid errors

-- ============================================================================
-- STEP 1: CREATE LIVE WALLET DATA VIEW
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS live_wallet_data;

-- Create enhanced live wallet data view
CREATE VIEW live_wallet_data AS
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
    -- Calculate total weight from collections
    COALESCE((
        SELECT SUM(c.weight_kg) 
        FROM collections c 
        WHERE c.user_id = p.id AND c.status = 'approved'
    ), 0) as total_weight_kg,
    -- Environmental impact calculation
    jsonb_build_object(
        'co2_saved_kg', COALESCE((
            SELECT SUM(c.weight_kg * 0.5) 
            FROM collections c 
            WHERE c.user_id = p.id AND c.status = 'approved'
        ), 0),
        'water_saved_liters', COALESCE((
            SELECT SUM(c.weight_kg * 0.1) 
            FROM collections c 
            WHERE c.user_id = p.id AND c.status = 'approved'
        ), 0),
        'landfill_saved_kg', COALESCE((
            SELECT SUM(c.weight_kg * 0.8) 
            FROM collections c 
            WHERE c.user_id = p.id AND c.status = 'approved'
        ), 0),
        'trees_equivalent', COALESCE((
            SELECT SUM(c.weight_kg * 0.1) 
            FROM collections c 
            WHERE c.user_id = p.id AND c.status = 'approved'
        ), 0)
    ) as environmental_impact,
    COALESCE(w.updated_at, w.created_at) as last_updated,
    -- Recent activity (last 7 days)
    (SELECT COUNT(*) FROM transactions t 
     WHERE t.user_id = p.id 
     AND t.created_at > NOW() - INTERVAL '7 days') as recent_transactions,
    -- Next tier info
    CASE 
        WHEN COALESCE(w.tier, 'bronze') = 'bronze' THEN 'silver'
        WHEN COALESCE(w.tier, 'bronze') = 'silver' THEN 'gold'
        WHEN COALESCE(w.tier, 'bronze') = 'gold' THEN 'platinum'
        ELSE NULL
    END as next_tier,
    CASE 
        WHEN COALESCE(w.tier, 'bronze') = 'bronze' THEN 200 - COALESCE(w.total_points, 0)
        WHEN COALESCE(w.tier, 'bronze') = 'silver' THEN 500 - COALESCE(w.total_points, 0)
        WHEN COALESCE(w.tier, 'bronze') = 'gold' THEN 1000 - COALESCE(w.total_points, 0)
        ELSE 0
    END as points_to_next_tier
FROM profiles p
LEFT JOIN wallets w ON p.id = w.user_id
WHERE p.status = 'active';

-- ============================================================================
-- STEP 2: CREATE COLLECTION SUMMARY VIEW
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS collection_summary;

-- Create collection summary view
CREATE VIEW collection_summary AS
SELECT 
    c.user_id,
    COUNT(*) as total_collections,
    COUNT(CASE WHEN c.status = 'approved' THEN 1 END) as completed_collections,
    COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_collections,
    COUNT(CASE WHEN c.status = 'rejected' THEN 1 END) as rejected_collections,
    COALESCE(SUM(c.weight_kg), 0) as total_weight_kg,
    COALESCE(SUM(
        CASE
            WHEN c.material_type = 'Paper' THEN c.weight_kg * 0.80
            WHEN c.material_type = 'Plastic' THEN c.weight_kg * 1.50
            WHEN c.material_type = 'Glass' THEN c.weight_kg * 1.20
            WHEN c.material_type = 'Metal' THEN c.weight_kg * 18.55
            WHEN c.material_type = 'Cardboard' THEN c.weight_kg * 0.60
            ELSE c.weight_kg * 1.00
        END
    ), 0) as total_value,
    COALESCE(SUM(
        CASE
            WHEN c.material_type = 'Paper' THEN FLOOR(c.weight_kg * 2)
            WHEN c.material_type = 'Plastic' THEN FLOOR(c.weight_kg * 3)
            WHEN c.material_type = 'Glass' THEN FLOOR(c.weight_kg * 2.5)
            WHEN c.material_type = 'Metal' THEN FLOOR(c.weight_kg * 4)
            WHEN c.material_type = 'Cardboard' THEN FLOOR(c.weight_kg * 1.5)
            ELSE FLOOR(c.weight_kg * 2)
        END
    ), 0) as total_points
FROM collections c
GROUP BY c.user_id;

-- ============================================================================
-- STEP 3: CREATE WALLET TRANSACTIONS VIEW
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS wallet_transactions_live;

-- Create live wallet transactions view
CREATE VIEW wallet_transactions_live AS
SELECT 
    t.id,
    t.user_id,
    t.transaction_type,
    t.points as points_change,
    t.description,
    t.created_at,
    p.full_name,
    p.email
FROM transactions t
JOIN profiles p ON t.user_id = p.id
ORDER BY t.created_at DESC;

-- ============================================================================
-- STEP 4: CREATE WALLET UPDATE FUNCTION
-- ============================================================================

-- Function to update wallet balance and points with real-time updates
CREATE OR REPLACE FUNCTION update_wallet_balance_live(
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
-- STEP 5: CREATE COLLECTION PAYMENT PROCESSING FUNCTION
-- ============================================================================

-- Function to process collection payment and update wallet
CREATE OR REPLACE FUNCTION process_collection_payment_live(
    p_collection_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_collection RECORD;
    v_total_value DECIMAL(10,2);
    v_total_points INTEGER;
    v_environmental_impact JSONB;
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
    PERFORM update_wallet_balance_live(
        v_collection.user_id,
        v_collection.calculated_value,
        v_collection.calculated_points,
        'collection',
        'Collection payment for ' || v_collection.id,
        p_collection_id
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
-- STEP 6: CREATE REAL-TIME WALLET DATA FUNCTION
-- ============================================================================

-- Function to get live wallet data for a specific user
CREATE OR REPLACE FUNCTION get_live_wallet_data(p_user_id UUID)
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
    environmental_impact JSONB,
    last_updated TIMESTAMP WITH TIME ZONE,
    recent_transactions BIGINT,
    next_tier TEXT,
    points_to_next_tier INTEGER
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
        jsonb_build_object(
            'co2_saved_kg', COALESCE((
                SELECT SUM(c.weight_kg * 0.5) 
                FROM collections c 
                WHERE c.user_id = p.id AND c.status = 'approved'
            ), 0),
            'water_saved_liters', COALESCE((
                SELECT SUM(c.weight_kg * 0.1) 
                FROM collections c 
                WHERE c.user_id = p.id AND c.status = 'approved'
            ), 0),
            'landfill_saved_kg', COALESCE((
                SELECT SUM(c.weight_kg * 0.8) 
                FROM collections c 
                WHERE c.user_id = p.id AND c.status = 'approved'
            ), 0),
            'trees_equivalent', COALESCE((
                SELECT SUM(c.weight_kg * 0.1) 
                FROM collections c 
                WHERE c.user_id = p.id AND c.status = 'approved'
            ), 0)
        ) as environmental_impact,
        COALESCE(w.updated_at, w.created_at) as last_updated,
        (SELECT COUNT(*) FROM transactions t 
         WHERE t.user_id = p.id 
         AND t.created_at > NOW() - INTERVAL '7 days') as recent_transactions,
        CASE 
            WHEN COALESCE(w.tier, 'bronze') = 'bronze' THEN 'silver'
            WHEN COALESCE(w.tier, 'bronze') = 'silver' THEN 'gold'
            WHEN COALESCE(w.tier, 'bronze') = 'gold' THEN 'platinum'
            ELSE NULL
        END as next_tier,
        CASE 
            WHEN COALESCE(w.tier, 'bronze') = 'bronze' THEN 200 - COALESCE(w.total_points, 0)
            WHEN COALESCE(w.tier, 'bronze') = 'silver' THEN 500 - COALESCE(w.total_points, 0)
            WHEN COALESCE(w.tier, 'bronze') = 'gold' THEN 1000 - COALESCE(w.total_points, 0)
            ELSE 0
        END as points_to_next_tier
    FROM profiles p
    LEFT JOIN wallets w ON p.id = w.user_id
    WHERE p.id = p_user_id AND p.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 7: GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions for live wallet data view
GRANT SELECT ON live_wallet_data TO authenticated;
GRANT SELECT ON collection_summary TO authenticated;
GRANT SELECT ON wallet_transactions_live TO authenticated;

-- Grant execute permissions for functions
GRANT EXECUTE ON FUNCTION update_wallet_balance_live TO authenticated;
GRANT EXECUTE ON FUNCTION process_collection_payment_live TO authenticated;
GRANT EXECUTE ON FUNCTION get_live_wallet_data TO authenticated;

-- ============================================================================
-- STEP 8: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for live data queries
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_updated_at ON wallets(updated_at);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);

-- ============================================================================
-- STEP 9: CREATE RLS POLICIES (RUN AFTER VIEWS ARE CREATED)
-- ============================================================================

-- Policy for live wallet data view
CREATE POLICY "Users can view own live wallet data" ON live_wallet_data
    FOR SELECT USING (user_id = auth.uid());

-- Policy for collection summary view
CREATE POLICY "Users can view own collection summary" ON collection_summary
    FOR SELECT USING (user_id = auth.uid());

-- Policy for wallet transactions view
CREATE POLICY "Users can view own wallet transactions" ON wallet_transactions_live
    FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- STEP 10: TEST THE SYSTEM
-- ============================================================================

-- Test the live wallet data
-- SELECT * FROM live_wallet_data LIMIT 5;

-- Test the collection summary
-- SELECT * FROM collection_summary LIMIT 5;

-- Test the wallet transactions
-- SELECT * FROM wallet_transactions_live LIMIT 5;
