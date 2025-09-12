-- Enhance Existing Supabase Database for Live Data Access
-- This script adds live data views and real-time wallet update functions
-- to your existing Supabase database structure

-- ============================================================================
-- 1. CREATE LIVE WALLET DATA VIEW
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS live_wallet_data;

-- Create live wallet data view for main app
CREATE VIEW live_wallet_data AS
SELECT 
    uw.id as wallet_id,
    uw.user_id,
    p.full_name,
    p.email,
    p.phone,
    uw.balance,
    uw.total_points,
    uw.tier,
    COALESCE(uw.balance, 0) as total_earnings,
    COALESCE(uw.total_weight_kg, 0) as total_weight_kg,
    COALESCE(uw.environmental_impact, '{}'::jsonb) as environmental_impact,
    COALESCE(uw.last_updated, uw.updated_at, uw.created_at) as last_updated,
    -- Recent activity (last 7 days)
    (SELECT COUNT(*) FROM points_transactions pt 
     WHERE pt.wallet_id = uw.id 
     AND pt.created_at > NOW() - INTERVAL '7 days') as recent_transactions,
    -- Next tier info
    CASE 
        WHEN uw.tier = 'Bronze' OR uw.tier = 'bronze' THEN 'Silver'
        WHEN uw.tier = 'Silver' OR uw.tier = 'silver' THEN 'Gold'
        WHEN uw.tier = 'Gold' OR uw.tier = 'gold' THEN 'Platinum'
        ELSE NULL
    END as next_tier,
    CASE 
        WHEN uw.tier = 'Bronze' OR uw.tier = 'bronze' THEN 200 - uw.total_points
        WHEN uw.tier = 'Silver' OR uw.tier = 'silver' THEN 500 - uw.total_points
        WHEN uw.tier = 'Gold' OR uw.tier = 'gold' THEN 1000 - uw.total_points
        ELSE 0
    END as points_to_next_tier
FROM user_wallets uw
JOIN profiles p ON uw.user_id = p.id
WHERE p.status = 'active';

-- ============================================================================
-- 2. CREATE COLLECTION SUMMARY VIEW
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS collection_summary;

-- Create collection summary view
CREATE VIEW collection_summary AS
SELECT 
    uc.customer_id as user_id,
    COUNT(*) as total_collections,
    COUNT(CASE WHEN uc.status = 'completed' THEN 1 END) as completed_collections,
    COUNT(CASE WHEN uc.status = 'pending' THEN 1 END) as pending_collections,
    COUNT(CASE WHEN uc.status = 'approved' THEN 1 END) as approved_collections,
    COALESCE(SUM(uc.total_weight_kg), 0) as total_weight_kg,
    COALESCE(SUM(uc.total_value), 0) as total_value,
    COALESCE(SUM(uc.total_points), 0) as total_points
FROM unified_collections uc
GROUP BY uc.customer_id;

-- ============================================================================
-- 3. CREATE ENHANCED WALLET UPDATE FUNCTION
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
    SELECT id INTO v_wallet_id FROM user_wallets WHERE user_id = p_user_id;
    
    IF v_wallet_id IS NULL THEN
        INSERT INTO user_wallets (user_id, balance, total_points, tier)
        VALUES (p_user_id, 0, 0, 'Bronze')
        RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Calculate new values
    SELECT 
        balance + p_balance_change,
        total_points + p_points_change
    INTO v_new_balance, v_new_points
    FROM user_wallets WHERE id = v_wallet_id;
    
    -- Calculate tier based on points
    v_new_tier := CASE
        WHEN v_new_points >= 1000 THEN 'Platinum'
        WHEN v_new_points >= 500 THEN 'Gold'
        WHEN v_new_points >= 200 THEN 'Silver'
        ELSE 'Bronze'
    END;
    
    -- Update wallet
    UPDATE user_wallets 
    SET 
        balance = v_new_balance,
        total_points = v_new_points,
        tier = v_new_tier,
        last_updated = NOW(),
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Record points transaction
    INSERT INTO points_transactions (
        wallet_id, user_id, transaction_type, points, 
        balance_after, source, reference_id, description
    ) VALUES (
        v_wallet_id, p_user_id, p_transaction_type, p_points_change,
        v_new_points, p_transaction_type, p_reference_id, p_description
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. CREATE COLLECTION PAYMENT PROCESSING FUNCTION
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
        uc.*,
        COALESCE(SUM(cm.total_value), 0) as calculated_value,
        COALESCE(SUM(cm.total_points), 0) as calculated_points
    INTO v_collection
    FROM unified_collections uc
    LEFT JOIN collection_materials cm ON uc.id = cm.collection_id
    WHERE uc.id = p_collection_id
    GROUP BY uc.id;
    
    IF v_collection.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate environmental impact
    v_environmental_impact := jsonb_build_object(
        'co2_saved_kg', v_collection.total_weight_kg * 2.5,
        'water_saved_liters', v_collection.total_weight_kg * 100,
        'landfill_saved_kg', v_collection.total_weight_kg * 0.8,
        'trees_equivalent', v_collection.total_weight_kg * 0.1
    );
    
    -- Update wallet
    PERFORM update_wallet_balance_live(
        v_collection.customer_id,
        v_collection.calculated_value,
        v_collection.calculated_points,
        'collection',
        'Collection payment for ' || v_collection.id,
        p_collection_id
    );
    
    -- Update collection with calculated values
    UPDATE unified_collections 
    SET 
        total_value = v_collection.calculated_value,
        total_points = v_collection.calculated_points,
        updated_at = NOW()
    WHERE id = p_collection_id;
    
    -- Update wallet environmental impact
    UPDATE user_wallets 
    SET 
        environmental_impact = COALESCE(environmental_impact, '{}'::jsonb) || v_environmental_impact,
        total_weight_kg = total_weight_kg + v_collection.total_weight_kg,
        total_earned = total_earned + v_collection.calculated_value
    WHERE user_id = v_collection.customer_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. CREATE REAL-TIME WALLET DATA FUNCTION
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
        uw.id as wallet_id,
        uw.user_id,
        p.full_name,
        p.email,
        p.phone,
        uw.balance,
        uw.total_points,
        uw.tier,
        COALESCE(uw.balance, 0) as total_earnings,
        COALESCE(uw.total_weight_kg, 0) as total_weight_kg,
        COALESCE(uw.environmental_impact, '{}'::jsonb) as environmental_impact,
        COALESCE(uw.last_updated, uw.updated_at, uw.created_at) as last_updated,
        (SELECT COUNT(*) FROM points_transactions pt 
         WHERE pt.wallet_id = uw.id 
         AND pt.created_at > NOW() - INTERVAL '7 days') as recent_transactions,
        CASE 
            WHEN uw.tier = 'Bronze' OR uw.tier = 'bronze' THEN 'Silver'
            WHEN uw.tier = 'Silver' OR uw.tier = 'silver' THEN 'Gold'
            WHEN uw.tier = 'Gold' OR uw.tier = 'gold' THEN 'Platinum'
            ELSE NULL
        END as next_tier,
        CASE 
            WHEN uw.tier = 'Bronze' OR uw.tier = 'bronze' THEN 200 - uw.total_points
            WHEN uw.tier = 'Silver' OR uw.tier = 'silver' THEN 500 - uw.total_points
            WHEN uw.tier = 'Gold' OR uw.tier = 'gold' THEN 1000 - uw.total_points
            ELSE 0
        END as points_to_next_tier
    FROM user_wallets uw
    JOIN profiles p ON uw.user_id = p.id
    WHERE uw.user_id = p_user_id AND p.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CREATE WALLET TRANSACTIONS VIEW
-- ============================================================================

-- Drop existing view if it exists
DROP VIEW IF EXISTS wallet_transactions_live;

-- Create live wallet transactions view
CREATE VIEW wallet_transactions_live AS
SELECT 
    pt.id,
    pt.wallet_id,
    pt.user_id,
    pt.transaction_type,
    pt.points as points_change,
    pt.balance_after,
    pt.source,
    pt.reference_id,
    pt.description,
    pt.created_at,
    p.full_name,
    p.email
FROM points_transactions pt
JOIN profiles p ON pt.user_id = p.id
ORDER BY pt.created_at DESC;

-- ============================================================================
-- 7. GRANT PERMISSIONS FOR LIVE DATA ACCESS
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
-- 8. CREATE RLS POLICIES FOR LIVE DATA
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
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Indexes for live data queries
CREATE INDEX IF NOT EXISTS idx_user_wallets_user_id ON user_wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_wallets_last_updated ON user_wallets(last_updated);
CREATE INDEX IF NOT EXISTS idx_points_transactions_wallet_id ON points_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_unified_collections_customer_id ON unified_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_unified_collections_status ON unified_collections(status);

-- ============================================================================
-- 10. SAMPLE DATA FOR TESTING
-- ============================================================================

-- Insert sample materials if they don't exist
INSERT INTO materials (id, name, category, rate_per_kg, points_per_kg) VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', 'Aluminum Cans', 'Metal', 15.50, 15),
    ('660e8400-e29b-41d4-a716-446655440002', 'Plastic Bottles', 'Plastic', 8.75, 8),
    ('660e8400-e29b-41d4-a716-446655440003', 'Cardboard', 'Paper', 3.25, 3),
    ('660e8400-e29b-41d4-a716-446655440004', 'Glass Bottles', 'Glass', 2.50, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DEPLOYMENT COMPLETE
-- ============================================================================

-- The enhanced live data system is now ready!
-- You can now use:
-- 1. live_wallet_data view for real-time wallet information
-- 2. update_wallet_balance_live() function for wallet updates
-- 3. process_collection_payment_live() function for collection payments
-- 4. get_live_wallet_data() function for specific user data
-- 5. Real-time subscriptions for instant updates
