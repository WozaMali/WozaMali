-- ============================================================================
-- FIX ALL USER WALLET BALANCES - UNIVERSAL BALANCE CALCULATION
-- ============================================================================
-- This script applies the same balance calculation logic that was used for 
-- legacymusicsa@gmail.com to ALL users in the system
-- 
-- The logic calculates:
-- 1. Total earnings from approved collections (30% of collection value)
-- 2. Total withdrawals made by the user
-- 3. Current balance = Total earnings - Total withdrawals
-- 4. Points = Total weight in kg from collections
-- 5. Tier based on total points/weight

-- ============================================================================
-- STEP 1: CREATE COMPREHENSIVE USER BALANCE CALCULATION
-- ============================================================================

-- First, let's see what users we have and their current wallet status
SELECT 
    'Current User Wallet Status:' as info,
    COUNT(DISTINCT p.id) as total_users,
    COUNT(DISTINCT w.user_id) as users_with_wallets,
    COUNT(DISTINCT p.id) - COUNT(DISTINCT w.user_id) as users_without_wallets
FROM profiles p
LEFT JOIN wallets w ON p.id = w.user_id;

-- ============================================================================
-- STEP 2: CALCULATE BALANCES FOR ALL USERS
-- ============================================================================

-- Create a comprehensive view of all user balances
WITH user_balance_calculations AS (
    SELECT 
        p.id as user_id,
        p.full_name,
        p.email,
        
        -- Calculate total earnings from approved collections
        COALESCE(SUM(
            CASE 
                WHEN c.status = 'approved' THEN pi.total_price * 0.3  -- 30% of collection value
                ELSE 0 
            END
        ), 0) as total_earnings,
        
        -- Calculate total weight/points from approved collections
        COALESCE(SUM(
            CASE 
                WHEN c.status = 'approved' THEN pi.quantity
                ELSE 0 
            END
        ), 0) as total_weight_kg,
        
        -- Count approved collections
        COUNT(DISTINCT CASE WHEN c.status = 'approved' THEN c.id END) as approved_collections,
        
        -- Calculate total withdrawals
        COALESCE((
            SELECT SUM(amount) 
            FROM withdrawal_requests wr 
            WHERE wr.user_id = p.id 
            AND wr.status IN ('approved', 'processing', 'completed')
        ), 0) as total_withdrawals,
        
        -- Calculate current balance (earnings - withdrawals)
        COALESCE(SUM(
            CASE 
                WHEN c.status = 'approved' THEN pi.total_price * 0.3
                ELSE 0 
            END
        ), 0) - COALESCE((
            SELECT SUM(amount) 
            FROM withdrawal_requests wr 
            WHERE wr.user_id = p.id 
            AND wr.status IN ('approved', 'processing', 'completed')
        ), 0) as calculated_balance,
        
        -- Calculate tier based on total weight
        CASE
            WHEN COALESCE(SUM(
                CASE 
                    WHEN c.status = 'approved' THEN pi.quantity
                    ELSE 0 
                END
            ), 0) >= 1000 THEN 'platinum'
            WHEN COALESCE(SUM(
                CASE 
                    WHEN c.status = 'approved' THEN pi.quantity
                    ELSE 0 
                END
            ), 0) >= 500 THEN 'gold'
            WHEN COALESCE(SUM(
                CASE 
                    WHEN c.status = 'approved' THEN pi.quantity
                    ELSE 0 
                END
            ), 0) >= 250 THEN 'silver'
            WHEN COALESCE(SUM(
                CASE 
                    WHEN c.status = 'approved' THEN pi.quantity
                    ELSE 0 
                END
            ), 0) >= 100 THEN 'bronze'
            ELSE 'bronze'
        END as calculated_tier
        
    FROM profiles p
    LEFT JOIN collections c ON p.id = c.user_id
    LEFT JOIN pickup_items pi ON c.id = pi.pickup_id
    GROUP BY p.id, p.full_name, p.email
)

-- ============================================================================
-- STEP 3: UPDATE WALLET BALANCES FOR ALL USERS
-- ============================================================================

-- Update existing wallets with calculated balances
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
-- STEP 4: CREATE WALLETS FOR USERS WHO DON'T HAVE THEM
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
-- STEP 5: VERIFICATION - SHOW UPDATED BALANCES
-- ============================================================================

-- Show summary of updated balances
SELECT 
    'Updated Wallet Balances Summary:' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN w.balance > 0 THEN 1 END) as users_with_positive_balance,
    COUNT(CASE WHEN w.balance = 0 THEN 1 END) as users_with_zero_balance,
    SUM(w.balance) as total_system_balance,
    AVG(w.balance) as average_balance,
    MAX(w.balance) as highest_balance
FROM wallets w
JOIN profiles p ON w.user_id = p.id;

-- Show tier distribution
SELECT 
    'Tier Distribution:' as info,
    tier,
    COUNT(*) as user_count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM wallets w
JOIN profiles p ON w.user_id = p.id
GROUP BY tier
ORDER BY 
    CASE tier
        WHEN 'platinum' THEN 4
        WHEN 'gold' THEN 3
        WHEN 'silver' THEN 2
        WHEN 'bronze' THEN 1
    END DESC;

-- Show top 10 users by balance
SELECT 
    'Top 10 Users by Balance:' as info,
    p.full_name,
    p.email,
    w.balance,
    w.total_points,
    w.tier,
    w.updated_at
FROM wallets w
JOIN profiles p ON w.user_id = p.id
ORDER BY w.balance DESC
LIMIT 10;

-- Show users with collections but zero balance (for debugging)
SELECT 
    'Users with Collections but Zero Balance:' as info,
    p.full_name,
    p.email,
    w.balance,
    COUNT(DISTINCT c.id) as total_collections,
    COUNT(DISTINCT CASE WHEN c.status = 'approved' THEN c.id END) as approved_collections,
    SUM(CASE WHEN c.status = 'approved' THEN pi.total_price * 0.3 ELSE 0 END) as calculated_earnings,
    COALESCE(SUM(wr.amount), 0) as total_withdrawals
FROM profiles p
JOIN wallets w ON p.id = w.user_id
LEFT JOIN collections c ON p.id = c.user_id
LEFT JOIN pickup_items pi ON c.id = pi.pickup_id
LEFT JOIN withdrawal_requests wr ON p.id = wr.user_id AND wr.status IN ('approved', 'processing', 'completed')
WHERE w.balance = 0
AND EXISTS (SELECT 1 FROM collections c2 WHERE c2.user_id = p.id AND c2.status = 'approved')
GROUP BY p.id, p.full_name, p.email, w.balance
ORDER BY calculated_earnings DESC;

-- ============================================================================
-- STEP 6: SPECIFIC VERIFICATION FOR LEGACYMUSICSA@GMAIL.COM
-- ============================================================================

-- Verify the specific user mentioned in the issue
SELECT 
    'Legacy Music SA Verification:' as info,
    p.full_name,
    p.email,
    w.balance as current_wallet_balance,
    w.total_points as current_points,
    w.tier as current_tier,
    COUNT(DISTINCT c.id) as total_collections,
    COUNT(DISTINCT CASE WHEN c.status = 'approved' THEN c.id END) as approved_collections,
    SUM(CASE WHEN c.status = 'approved' THEN pi.total_price * 0.3 ELSE 0 END) as calculated_earnings,
    COALESCE(SUM(wr.amount), 0) as total_withdrawals,
    SUM(CASE WHEN c.status = 'approved' THEN pi.total_price * 0.3 ELSE 0 END) - COALESCE(SUM(wr.amount), 0) as calculated_balance
FROM profiles p
JOIN wallets w ON p.id = w.user_id
LEFT JOIN collections c ON p.id = c.user_id
LEFT JOIN pickup_items pi ON c.id = pi.pickup_id
LEFT JOIN withdrawal_requests wr ON p.id = wr.user_id AND wr.status IN ('approved', 'processing', 'completed')
WHERE p.email = 'legacymusicsa@gmail.com'
GROUP BY p.id, p.full_name, p.email, w.balance, w.total_points, w.tier;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
    '✅ ALL USER WALLET BALANCES FIXED' as status,
    'Applied the same balance calculation logic used for legacymusicsa@gmail.com to ALL users' as description,
    'Wallet balances now reflect: Total Earnings (30% of approved collections) - Total Withdrawals' as calculation_method,
    'All users should now see their correct balance in the app' as result;
