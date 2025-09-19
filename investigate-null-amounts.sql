-- ============================================================================
-- INVESTIGATE NULL AMOUNTS ISSUE
-- ============================================================================

-- Step 1: Check if there are actually any PET transactions
SELECT '=== CHECKING FOR PET TRANSACTIONS ===' as step;
SELECT 
    COUNT(*) as total_count,
    'Total PET transactions found' as description
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');

-- Step 2: Show all columns for PET transactions to see what's happening
SELECT '=== PET TRANSACTIONS WITH ALL COLUMNS ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    description,
    source_type,
    source_id,
    created_at,
    updated_at
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC;

-- Step 3: Check if amount column has NULL values
SELECT '=== CHECKING FOR NULL AMOUNTS ===' as step;
SELECT 
    'NULL amounts count: ' || COUNT(*) as info
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation') 
  AND amount IS NULL
UNION ALL
SELECT 
    'Non-NULL amounts count: ' || COUNT(*) as info
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation') 
  AND amount IS NOT NULL;

-- Step 4: Check the data types and values
SELECT '=== DATA TYPE AND VALUE ANALYSIS ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    pg_typeof(amount) as amount_type,
    CASE 
        WHEN amount IS NULL THEN 'NULL'
        WHEN amount = 0 THEN 'ZERO'
        ELSE amount::text
    END as amount_status,
    description
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC;

-- Step 5: Try different ways to sum the amounts
SELECT '=== DIFFERENT SUM CALCULATIONS ===' as step;

-- Method 1: Direct sum
SELECT 
    'Method 1 - Direct SUM: ' || COALESCE(SUM(amount), 0)::text as calculation
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');

-- Method 2: Sum with CASE
SELECT 
    'Method 2 - CASE SUM: ' || COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0)::text as calculation
FROM green_scholar_transactions;

-- Method 3: Sum with COALESCE for NULL handling
SELECT 
    'Method 3 - COALESCE SUM: ' || COALESCE(SUM(COALESCE(amount, 0)), 0)::text as calculation
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');

-- Step 6: Check if there are any transactions with different transaction types
SELECT '=== ALL TRANSACTION TYPES ===' as step;
SELECT 
    transaction_type,
    COUNT(*) as count,
    COALESCE(SUM(amount), 0) as total_amount
FROM green_scholar_transactions
GROUP BY transaction_type
ORDER BY transaction_type;

-- Step 7: Check the exact query that's failing
SELECT '=== EXACT QUERY FROM CODE ===' as step;
SELECT 
    'This is the exact query from GreenScholarFundService:' as explanation
UNION ALL
SELECT 
    'SELECT COALESCE(SUM(CASE WHEN transaction_type IN (''pet_contribution'', ''pet_donation'') THEN amount ELSE 0 END), 0) as pet_revenue FROM green_scholar_transactions'
UNION ALL
SELECT 
    'Result: ' || COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0)::text
FROM green_scholar_transactions;

-- Step 8: Check if there are any views or functions affecting this
SELECT '=== CHECKING FOR VIEWS ===' as step;
SELECT 
    viewname,
    definition
FROM pg_views 
WHERE viewname ILIKE '%green_scholar%'
   OR definition ILIKE '%green_scholar%';

SELECT '=== INVESTIGATION COMPLETED ===' as result;
