-- ============================================================================
-- CORRECT WALLET BALANCE CALCULATION - PET BOTTLES ONLY TO GREEN SCHOLAR FUND
-- ============================================================================
-- This script applies the CORRECT business rule:
-- - PET Bottles: 100% to Green Scholar Fund (0% to user wallet)
-- - Everything else: 100% to user wallet

-- ============================================================================
-- STEP 1: UPDATE EXISTING WALLETS WITH CORRECT BALANCES
-- ============================================================================

-- Update all existing wallets with correct calculations
UPDATE wallets 
SET 
    balance = GREATEST(0, (
        -- Calculate total earnings from approved collections
        -- PET Bottles: 0% to wallet, Everything else: 100% to wallet
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
            WHERE c.user_id = wallets.user_id 
            AND c.status = 'approved'
        ), 0) - 
        -- Subtract total withdrawals
        COALESCE((
            SELECT SUM(amount)
            FROM withdrawal_requests wr
            WHERE wr.user_id = wallets.user_id 
            AND wr.status IN ('approved', 'processing', 'completed')
        ), 0)
    )),
    total_points = COALESCE((
        SELECT SUM(pi.quantity)::INTEGER
        FROM collections c
        JOIN pickup_items pi ON c.id = pi.pickup_id
        WHERE c.user_id = wallets.user_id 
        AND c.status = 'approved'
    ), 0),
    tier = CASE
        WHEN COALESCE((
            SELECT SUM(pi.quantity)
            FROM collections c
            JOIN pickup_items pi ON c.id = pi.pickup_id
            WHERE c.user_id = wallets.user_id 
            AND c.status = 'approved'
        ), 0) >= 1000 THEN 'platinum'
        WHEN COALESCE((
            SELECT SUM(pi.quantity)
            FROM collections c
            JOIN pickup_items pi ON c.id = pi.pickup_id
            WHERE c.user_id = wallets.user_id 
            AND c.status = 'approved'
        ), 0) >= 500 THEN 'gold'
        WHEN COALESCE((
            SELECT SUM(pi.quantity)
            FROM collections c
            JOIN pickup_items pi ON c.id = pi.pickup_id
            WHERE c.user_id = wallets.user_id 
            AND c.status = 'approved'
        ), 0) >= 250 THEN 'silver'
        WHEN COALESCE((
            SELECT SUM(pi.quantity)
            FROM collections c
            JOIN pickup_items pi ON c.id = pi.pickup_id
            WHERE c.user_id = wallets.user_id 
            AND c.status = 'approved'
        ), 0) >= 100 THEN 'bronze'
        ELSE 'bronze'
    END,
    updated_at = NOW();

-- ============================================================================
-- STEP 2: CREATE WALLETS FOR USERS WHO DON'T HAVE THEM
-- ============================================================================

-- Create wallets for users who have approved collections but no wallet record
INSERT INTO wallets (user_id, balance, total_points, tier, created_at, updated_at)
SELECT 
    p.id,
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
        COALESCE((
            SELECT SUM(amount)
            FROM withdrawal_requests wr
            WHERE wr.user_id = p.id 
            AND wr.status IN ('approved', 'processing', 'completed')
        ), 0)
    )),
    COALESCE((
        SELECT SUM(pi.quantity)::INTEGER
        FROM collections c
        JOIN pickup_items pi ON c.id = pi.pickup_id
        WHERE c.user_id = p.id 
        AND c.status = 'approved'
    ), 0),
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
    END,
    NOW(),
    NOW()
FROM profiles p
WHERE NOT EXISTS (SELECT 1 FROM wallets w WHERE w.user_id = p.id)
AND EXISTS (
    SELECT 1 FROM collections c 
    WHERE c.user_id = p.id 
    AND c.status = 'approved'
);

-- ============================================================================
-- STEP 3: VERIFICATION - SHOW CORRECTED BALANCES
-- ============================================================================

-- Show updated balance summary
SELECT 
    'Corrected Balance Summary:' as info,
    COUNT(*) as total_users_with_wallets,
    COUNT(CASE WHEN balance > 0 THEN 1 END) as users_with_positive_balance,
    SUM(balance) as total_system_balance,
    ROUND(AVG(balance), 2) as average_balance
FROM wallets;

-- Show material breakdown for verification
SELECT 
    'Material Allocation Verification:' as info,
    m.name as material_name,
    COUNT(DISTINCT c.user_id) as users_with_this_material,
    SUM(pi.quantity) as total_weight_kg,
    SUM(pi.total_price) as total_value,
    SUM(
        CASE 
            WHEN LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%' THEN 0  -- PET: 0% to wallet
            ELSE pi.total_price  -- Everything else: 100% to wallet
        END
    ) as wallet_allocation,
    SUM(
        CASE 
            WHEN LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%' THEN pi.total_price  -- PET: 100% to Green Scholar
            ELSE 0  -- Everything else: 0% to Green Scholar
        END
    ) as green_scholar_allocation
FROM collections c
JOIN pickup_items pi ON c.id = pi.pickup_id
JOIN materials m ON pi.material_id = m.id
WHERE c.status = 'approved'
GROUP BY m.name
ORDER BY total_value DESC;

-- Show specific verification for legacymusicsa@gmail.com
SELECT 
    'Legacy Music SA Corrected Balance:' as info,
    p.full_name,
    p.email,
    w.balance,
    w.total_points,
    w.tier,
    -- Show breakdown by material type
    COALESCE((
        SELECT SUM(
            CASE 
                WHEN LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%' THEN 0
                ELSE pi.total_price
            END
        )
        FROM collections c
        JOIN pickup_items pi ON c.id = pi.pickup_id
        JOIN materials m ON pi.material_id = m.id
        WHERE c.user_id = p.id 
        AND c.status = 'approved'
    ), 0) as non_pet_earnings,
    COALESCE((
        SELECT SUM(pi.total_price)
        FROM collections c
        JOIN pickup_items pi ON c.id = pi.pickup_id
        JOIN materials m ON pi.material_id = m.id
        WHERE c.user_id = p.id 
        AND c.status = 'approved'
        AND (LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%')
    ), 0) as pet_earnings_to_green_scholar
FROM profiles p
JOIN wallets w ON p.id = w.user_id
WHERE p.email = 'legacymusicsa@gmail.com';

-- Show a few other users for comparison
SELECT 
    'Sample User Corrected Balances:' as info,
    p.full_name,
    p.email,
    w.balance,
    w.total_points,
    w.tier
FROM profiles p
JOIN wallets w ON p.id = w.user_id
WHERE p.email != 'legacymusicsa@gmail.com'
ORDER BY w.balance DESC
LIMIT 5;

SELECT '✅ WALLET BALANCES CORRECTED - PET BOTTLES ONLY TO GREEN SCHOLAR FUND' as status;
