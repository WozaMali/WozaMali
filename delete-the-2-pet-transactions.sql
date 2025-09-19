-- ============================================================================
-- DELETE THE 2 PET TRANSACTIONS THAT MAKE UP R13.50
-- ============================================================================

-- Step 1: Show what we're about to delete
SELECT '=== TRANSACTIONS TO BE DELETED ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    description,
    created_at
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC;

-- Step 2: Delete the 2 PET transactions
DELETE FROM green_scholar_transactions 
WHERE transaction_type IN ('pet_contribution', 'pet_donation');

SELECT 'Deleted all PET transactions' as result;

-- Step 3: Update fund balance to reflect the removal
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

SELECT 'Updated fund balance after deletion' as result;

-- Step 4: Verify the deletion
SELECT '=== VERIFICATION ===' as step;

-- Check remaining PET transactions (should be 0)
SELECT 
    'Remaining PET transactions: ' || COUNT(*) as info
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');

-- Check PET revenue (should be 0)
SELECT 
    'PET Revenue after deletion: ' || COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0)::text as info
FROM green_scholar_transactions;

-- Show updated fund balance
SELECT 
    'Updated fund balance:',
    total_balance,
    pet_donations_total,
    direct_donations_total,
    expenses_total
FROM green_scholar_fund_balance
ORDER BY updated_at DESC
LIMIT 1;

SELECT 'R13.50 PET TRANSACTIONS DELETED SUCCESSFULLY' as result;
