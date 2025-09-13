-- ============================================================================
-- FIX MAIN APP WALLET LOGIC - IMPLEMENT CORRECT BUSINESS RULE
-- ============================================================================
-- This script creates a database function that the Main App can use to get
-- the correct wallet balance based on the business rule:
-- - PET Bottles: 0% to user wallet (100% to Green Scholar Fund)
-- - Everything else: 100% to user wallet

-- ============================================================================
-- STEP 1: CREATE FUNCTION FOR CORRECT WALLET BALANCE CALCULATION
-- ============================================================================

CREATE OR REPLACE FUNCTION get_correct_user_wallet_balance(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    full_name TEXT,
    email TEXT,
    correct_balance DECIMAL(10,2),
    total_points INTEGER,
    tier TEXT,
    total_collections BIGINT,
    approved_collections BIGINT,
    pet_bottles_value DECIMAL(10,2),
    other_materials_value DECIMAL(10,2),
    total_withdrawals DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.full_name,
        p.email,
        
        -- Correct balance: Only non-PET materials go to wallet
        GREATEST(0, (
            COALESCE((
                SELECT SUM(
                    CASE 
                        WHEN LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%' THEN 0  -- PET: 0% to wallet
                        ELSE pi.total_price  -- Everything else: 100% to wallet
                    END
                )
                FROM collections c
                JOIN pickup_items pi ON c.id = pi.pickup_id
                JOIN materials m ON pi.material_id = m.id
                WHERE c.user_id = p.id 
                AND c.status = 'approved'
            ), 0) - 
            -- Subtract total withdrawals
            COALESCE((
                SELECT SUM(amount)
                FROM withdrawal_requests wr
                WHERE wr.user_id = p.id 
                AND wr.status IN ('approved', 'processing', 'completed')
            ), 0)
        )) as correct_balance,
        
        -- Total points (weight in kg)
        COALESCE((
            SELECT SUM(pi.quantity)::INTEGER
            FROM collections c
            JOIN pickup_items pi ON c.id = pi.pickup_id
            WHERE c.user_id = p.id 
            AND c.status = 'approved'
        ), 0) as total_points,
        
        -- Tier based on total weight
        CASE
            WHEN COALESCE((
                SELECT SUM(pi.quantity)
                FROM collections c
                JOIN pickup_items pi ON c.id = pi.pickup_id
                WHERE c.user_id = p.id 
                AND c.status = 'approved'
            ), 0) >= 1000 THEN 'platinum'
            WHEN COALESCE((
                SELECT SUM(pi.quantity)
                FROM collections c
                JOIN pickup_items pi ON c.id = pi.pickup_id
                WHERE c.user_id = p.id 
                AND c.status = 'approved'
            ), 0) >= 500 THEN 'gold'
            WHEN COALESCE((
                SELECT SUM(pi.quantity)
                FROM collections c
                JOIN pickup_items pi ON c.id = pi.pickup_id
                WHERE c.user_id = p.id 
                AND c.status = 'approved'
            ), 0) >= 250 THEN 'silver'
            WHEN COALESCE((
                SELECT SUM(pi.quantity)
                FROM collections c
                JOIN pickup_items pi ON c.id = pi.pickup_id
                WHERE c.user_id = p.id 
                AND c.status = 'approved'
            ), 0) >= 100 THEN 'bronze'
            ELSE 'bronze'
        END as tier,
        
        -- Collection counts
        COALESCE((
            SELECT COUNT(*)
            FROM collections c
            WHERE c.user_id = p.id
        ), 0) as total_collections,
        
        COALESCE((
            SELECT COUNT(*)
            FROM collections c
            WHERE c.user_id = p.id 
            AND c.status = 'approved'
        ), 0) as approved_collections,
        
        -- PET bottles value (goes to Green Scholar Fund)
        COALESCE((
            SELECT SUM(pi.total_price)
            FROM collections c
            JOIN pickup_items pi ON c.id = pi.pickup_id
            JOIN materials m ON pi.material_id = m.id
            WHERE c.user_id = p.id 
            AND c.status = 'approved'
            AND (LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%')
        ), 0) as pet_bottles_value,
        
        -- Other materials value (goes to user wallet)
        COALESCE((
            SELECT SUM(pi.total_price)
            FROM collections c
            JOIN pickup_items pi ON c.id = pi.pickup_id
            JOIN materials m ON pi.material_id = m.id
            WHERE c.user_id = p.id 
            AND c.status = 'approved'
            AND NOT (LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%')
        ), 0) as other_materials_value,
        
        -- Total withdrawals
        COALESCE((
            SELECT SUM(amount)
            FROM withdrawal_requests wr
            WHERE wr.user_id = p.id 
            AND wr.status IN ('approved', 'processing', 'completed')
        ), 0) as total_withdrawals
        
    FROM profiles p
    WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 2: CREATE FUNCTION TO UPDATE WALLET WITH CORRECT BALANCE
-- ============================================================================

CREATE OR REPLACE FUNCTION update_wallet_with_correct_balance(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    wallet_data RECORD;
BEGIN
    -- Get correct wallet data
    SELECT * INTO wallet_data
    FROM get_correct_user_wallet_balance(p_user_id);
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Update or insert wallet with correct balance
    INSERT INTO wallets (user_id, balance, total_points, tier, created_at, updated_at)
    VALUES (
        wallet_data.user_id,
        wallet_data.correct_balance,
        wallet_data.total_points,
        wallet_data.tier,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
        balance = wallet_data.correct_balance,
        total_points = wallet_data.total_points,
        tier = wallet_data.tier,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_correct_user_wallet_balance TO authenticated;
GRANT EXECUTE ON FUNCTION update_wallet_with_correct_balance TO authenticated;

-- ============================================================================
-- STEP 4: TEST THE FUNCTIONS
-- ============================================================================

-- Test with a specific user (replace with actual user ID)
-- SELECT * FROM get_correct_user_wallet_balance('your-user-id-here');

-- Test updating wallet
-- SELECT update_wallet_with_correct_balance('your-user-id-here');

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

-- Show sample of correct balances
SELECT 
    'Sample Correct Wallet Balances:' as info,
    user_id,
    full_name,
    email,
    correct_balance,
    total_points,
    tier,
    pet_bottles_value,
    other_materials_value,
    total_withdrawals
FROM get_correct_user_wallet_balance(
    (SELECT id FROM profiles LIMIT 1)
);

SELECT '✅ MAIN APP WALLET LOGIC FUNCTIONS CREATED' as status;
