-- ============================================================================
-- QUICK FIND R13.50 TRANSACTION
-- ============================================================================

-- Look for R13.50 in all variations
SELECT '=== R13.50 TRANSACTIONS ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    description,
    created_at
FROM green_scholar_transactions
WHERE amount = 13.50 OR amount = 13.5
ORDER BY created_at DESC;

-- Show all PET transactions
SELECT '=== ALL PET TRANSACTIONS ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    description,
    created_at
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC;

-- Show current fund balance
SELECT '=== FUND BALANCE ===' as step;
SELECT 
    pet_donations_total,
    total_balance
FROM green_scholar_fund_balance
ORDER BY created_at DESC
LIMIT 1;

-- Calculate PET revenue from transactions
SELECT '=== CALCULATED PET REVENUE ===' as step;
SELECT 
    COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) as pet_revenue
FROM green_scholar_transactions;
