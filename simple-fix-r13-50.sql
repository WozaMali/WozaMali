-- ============================================================================
-- SIMPLE FIX FOR R13.50 PET REVENUE
-- ============================================================================

-- Step 1: Check what's causing the R13.50
SELECT '=== CHECKING R13.50 SOURCES ===' as step;

-- Look for any transactions with R13.50
SELECT 
    id,
    transaction_type,
    amount,
    description,
    created_at
FROM green_scholar_transactions
WHERE amount = 13.50 OR amount = 13.5
ORDER BY created_at DESC;

-- Step 2: Remove ALL R13.50 transactions
DELETE FROM green_scholar_transactions 
WHERE amount = 13.50 OR amount = 13.5;

SELECT 'Deleted R13.50 transactions' as result;

-- Step 3: Update fund balance
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

-- Step 4: Verify the fix
SELECT 
    'PET Revenue after fix:' as description,
    COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) as pet_revenue
FROM green_scholar_transactions;

SELECT 'R13.50 FIX COMPLETED' as result;
