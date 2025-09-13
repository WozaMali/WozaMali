-- ============================================================================
-- QUICK FIX: UPDATE ALL USER WALLET BALANCES
-- ============================================================================
-- This is a simplified version that applies the same balance logic used for 
-- legacymusicsa@gmail.com to ALL users immediately

-- ============================================================================
-- STEP 1: UPDATE EXISTING WALLETS WITH CORRECT BALANCES
-- ============================================================================

-- Update all existing wallets with calculated balances from collections and withdrawals
UPDATE wallets 
SET 
    balance = GREATEST(0, (
        -- Calculate total earnings from approved collections (30% of value)
        COALESCE((
            SELECT SUM(pi.total_price * 0.3)
            FROM collections c
            JOIN pickup_items pi ON c.id = pi.pickup_id
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
            SELECT SUM(pi.total_price * 0.3)
            FROM collections c
            JOIN pickup_items pi ON c.id = pi.pickup_id
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
-- STEP 3: VERIFICATION
-- ============================================================================

-- Show updated balance summary
SELECT 
    'Updated Balance Summary:' as info,
    COUNT(*) as total_users_with_wallets,
    COUNT(CASE WHEN balance > 0 THEN 1 END) as users_with_positive_balance,
    SUM(balance) as total_system_balance,
    ROUND(AVG(balance), 2) as average_balance
FROM wallets;

-- Show specific verification for legacymusicsa@gmail.com
SELECT 
    'Legacy Music SA Balance:' as info,
    p.full_name,
    p.email,
    w.balance,
    w.total_points,
    w.tier
FROM profiles p
JOIN wallets w ON p.id = w.user_id
WHERE p.email = 'legacymusicsa@gmail.com';

-- Show a few other users for comparison
SELECT 
    'Sample User Balances:' as info,
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

SELECT '✅ ALL USER BALANCES UPDATED' as status;
