-- ============================================================================
-- RESET GREEN SCHOLAR FUND PET REVENUE (R13.50)
-- ============================================================================
-- Remove the specific R13.50 PET revenue from Green Scholar Fund

-- Step 1: Check current Green Scholar Fund data
SELECT '=== CHECKING CURRENT GREEN SCHOLAR FUND DATA ===' as step;

-- Check green_scholar_fund_balance
SELECT '=== GREEN SCHOLAR FUND BALANCE ===' as step;
SELECT 
    id,
    total_balance,
    pet_donations_total,
    direct_donations_total,
    expenses_total,
    created_at,
    updated_at
FROM green_scholar_fund_balance
ORDER BY created_at DESC;

-- Check green_scholar_transactions for PET contributions
SELECT '=== GREEN SCHOLAR TRANSACTIONS (PET CONTRIBUTIONS) ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    description,
    source_type,
    source_id,
    created_at
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC;

-- Check for transactions with R13.50 amount
SELECT '=== TRANSACTIONS WITH R13.50 AMOUNT ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    description,
    source_type,
    source_id,
    created_at
FROM green_scholar_transactions
WHERE amount = 13.50
ORDER BY created_at DESC;

-- Step 2: Calculate current PET revenue
SELECT '=== CURRENT PET REVENUE CALCULATION ===' as step;
SELECT 
    COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) as pet_revenue_from_transactions,
    COALESCE(SUM(CASE WHEN transaction_type IN ('donation', 'direct_donation') THEN amount ELSE 0 END), 0) as direct_donations,
    COALESCE(SUM(CASE WHEN transaction_type IN ('distribution', 'expense') THEN amount ELSE 0 END), 0) as distributions,
    COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) + 
    COALESCE(SUM(CASE WHEN transaction_type IN ('donation', 'direct_donation') THEN amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN transaction_type IN ('distribution', 'expense') THEN amount ELSE 0 END), 0) as calculated_balance
FROM green_scholar_transactions;

-- Step 3: Remove R13.50 PET transactions
SELECT '=== REMOVING R13.50 PET TRANSACTIONS ===' as step;

-- Delete transactions with R13.50 amount and PET contribution type
DELETE FROM green_scholar_transactions 
WHERE amount = 13.50 
  AND transaction_type IN ('pet_contribution', 'pet_donation');

SELECT 'Deleted R13.50 PET transactions' as result;

-- Step 4: Update fund balance to reflect the removal
SELECT '=== UPDATING FUND BALANCE ===' as step;

-- Calculate new totals after removal
WITH new_totals AS (
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) as pet_revenue,
        COALESCE(SUM(CASE WHEN transaction_type IN ('donation', 'direct_donation') THEN amount ELSE 0 END), 0) as direct_donations,
        COALESCE(SUM(CASE WHEN transaction_type IN ('distribution', 'expense') THEN amount ELSE 0 END), 0) as distributions
    FROM green_scholar_transactions
)
UPDATE green_scholar_fund_balance 
SET 
    total_balance = (SELECT pet_revenue + direct_donations - distributions FROM new_totals),
    pet_donations_total = (SELECT pet_revenue FROM new_totals),
    direct_donations_total = (SELECT direct_donations FROM new_totals),
    expenses_total = (SELECT distributions FROM new_totals),
    updated_at = NOW()
WHERE id IS NOT NULL;

SELECT 'Updated fund balance after R13.50 removal' as result;

-- Step 5: Verify the reset
SELECT '=== VERIFICATION AFTER RESET ===' as step;

-- Check updated green_scholar_fund_balance
SELECT 
    id,
    total_balance,
    pet_donations_total,
    direct_donations_total,
    expenses_total,
    updated_at
FROM green_scholar_fund_balance;

-- Check remaining PET transactions
SELECT 
    COUNT(*) as remaining_pet_transactions,
    COALESCE(SUM(amount), 0) as total_pet_revenue,
    'REMAINING PET TRANSACTIONS' as description
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');

-- Final calculation check
SELECT 
    COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) as pet_revenue_after_reset,
    COALESCE(SUM(CASE WHEN transaction_type IN ('donation', 'direct_donation') THEN amount ELSE 0 END), 0) as direct_donations_after_reset,
    COALESCE(SUM(CASE WHEN transaction_type IN ('distribution', 'expense') THEN amount ELSE 0 END), 0) as distributions_after_reset,
    COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) + 
    COALESCE(SUM(CASE WHEN transaction_type IN ('donation', 'direct_donation') THEN amount ELSE 0 END), 0) - 
    COALESCE(SUM(CASE WHEN transaction_type IN ('distribution', 'expense') THEN amount ELSE 0 END), 0) as calculated_balance_after_reset
FROM green_scholar_transactions;

SELECT 'GREEN SCHOLAR FUND PET REVENUE R13.50 RESET COMPLETED' as result;
