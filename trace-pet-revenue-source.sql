-- ============================================================================
-- TRACE PET REVENUE SOURCE - FIND THE R13.50
-- ============================================================================

-- Step 1: Show the exact calculation that produces R13.50
SELECT '=== PET REVENUE CALCULATION BREAKDOWN ===' as step;

-- This is the exact query used in the Green Scholar Fund service
SELECT 
    transaction_type,
    amount,
    description,
    created_at,
    'This transaction contributes: ' || amount::text || ' to PET revenue' as contribution
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC;

-- Step 2: Show the sum calculation
SELECT '=== SUM CALCULATION ===' as step;
SELECT 
    'Total PET transactions found: ' || COUNT(*) as info
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
UNION ALL
SELECT 
    'Sum of all PET amounts: ' || COALESCE(SUM(amount), 0)::text as info
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');

-- Step 3: Show each transaction individually with running total
SELECT '=== INDIVIDUAL TRANSACTIONS WITH RUNNING TOTAL ===' as step;
WITH pet_transactions AS (
    SELECT 
        id,
        transaction_type,
        amount,
        description,
        created_at,
        ROW_NUMBER() OVER (ORDER BY created_at DESC) as row_num
    FROM green_scholar_transactions
    WHERE transaction_type IN ('pet_contribution', 'pet_donation')
    ORDER BY created_at DESC
),
running_totals AS (
    SELECT 
        *,
        SUM(amount) OVER (ORDER BY created_at DESC) as running_total
    FROM pet_transactions
)
SELECT 
    row_num,
    transaction_type,
    amount,
    description,
    created_at,
    running_total,
    'Running total after this transaction: ' || running_total::text as running_total_text
FROM running_totals;

-- Step 4: Check if there are any NULL or empty transaction types
SELECT '=== CHECKING FOR NULL/EMPTY TRANSACTION TYPES ===' as step;
SELECT 
    'NULL transaction_type count: ' || COUNT(*) as info
FROM green_scholar_transactions
WHERE transaction_type IS NULL
UNION ALL
SELECT 
    'Empty string transaction_type count: ' || COUNT(*) as info
FROM green_scholar_transactions
WHERE transaction_type = ''
UNION ALL
SELECT 
    'All transaction types: ' || string_agg(DISTINCT transaction_type, ', ') as info
FROM green_scholar_transactions;

-- Step 5: Show all transactions (not just PET ones) to see if there's a hidden one
SELECT '=== ALL TRANSACTIONS IN THE TABLE ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    description,
    source_type,
    source_id,
    created_at
FROM green_scholar_transactions
ORDER BY created_at DESC;

-- Step 6: Check if there are any transactions with similar amounts that might be miscategorized
SELECT '=== TRANSACTIONS WITH AMOUNTS AROUND 13.50 ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    description,
    created_at,
    'This amount: ' || amount::text as amount_text
FROM green_scholar_transactions
WHERE amount BETWEEN 13.0 AND 14.0
ORDER BY amount DESC;

-- Step 7: Check the fund balance table to see if it has a different value
SELECT '=== FUND BALANCE TABLE VALUES ===' as step;
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

-- Step 8: Final verification - show the exact query that's being used
SELECT '=== EXACT QUERY USED IN CODE ===' as step;
SELECT 
    'This is the exact query from GreenScholarFundService.getFundOverview():' as explanation
UNION ALL
SELECT 
    'SELECT COALESCE(SUM(CASE WHEN transaction_type IN (''pet_contribution'', ''pet_donation'') THEN amount ELSE 0 END), 0) as pet_revenue FROM green_scholar_transactions'
UNION ALL
SELECT 
    'Result: ' || COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0)::text
FROM green_scholar_transactions;

SELECT '=== TRACE COMPLETED ===' as result;
