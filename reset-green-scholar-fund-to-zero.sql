-- ============================================================================
-- RESET GREEN SCHOLAR FUND TO ZERO
-- ============================================================================
-- This script resets all Green Scholar Fund values to 0 as requested
-- It will clear all transactions and reset the fund balance

-- ============================================================================
-- CLEAR ALL TRANSACTIONS
-- ============================================================================

-- Delete all Green Scholar transactions
DELETE FROM green_scholar_transactions;

-- Delete all user donations
DELETE FROM user_donations;

-- Delete all collection Green Scholar contributions
DELETE FROM collection_green_scholar_contributions;

-- ============================================================================
-- RESET FUND BALANCE TO ZERO
-- ============================================================================

-- Delete all existing fund balance records
DELETE FROM green_scholar_fund_balance;

-- Insert a single fund balance record with all values set to 0
INSERT INTO green_scholar_fund_balance (
    id,
    total_balance,
    pet_donations_total,
    direct_donations_total,
    expenses_total,
    last_updated
) VALUES (
    gen_random_uuid(),
    0.00,  -- Total balance reset to 0
    0.00,  -- PET donations reset to 0
    0.00,  -- Direct donations reset to 0
    0.00,  -- Expenses reset to 0
    NOW()
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show the reset fund balance
SELECT 'Green Scholar Fund Reset Complete!' as status;
SELECT 
    'Fund Balance:' as info,
    total_balance,
    pet_donations_total,
    direct_donations_total,
    expenses_total,
    last_updated
FROM green_scholar_fund_balance;

-- Show transaction counts (should all be 0)
SELECT 'Transaction Counts:' as info;
SELECT 
    'Green Scholar Transactions:' as table_name,
    COUNT(*) as count
FROM green_scholar_transactions
UNION ALL
SELECT 
    'User Donations:' as table_name,
    COUNT(*) as count
FROM user_donations
UNION ALL
SELECT 
    'Collection Contributions:' as table_name,
    COUNT(*) as count
FROM collection_green_scholar_contributions;
