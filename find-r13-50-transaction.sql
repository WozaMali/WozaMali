-- ============================================================================
-- FIND R13.50 TRANSACTION - COMPREHENSIVE SEARCH
-- ============================================================================

-- Step 1: Search green_scholar_transactions for R13.50
SELECT '=== SEARCHING GREEN_SCHOLAR_TRANSACTIONS ===' as step;

-- Exact match for 13.50
SELECT 
    'Exact 13.50' as search_type,
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

-- Exact match for 13.5
SELECT 
    'Exact 13.5' as search_type,
    id,
    transaction_type,
    amount,
    description,
    source_type,
    source_id,
    created_at
FROM green_scholar_transactions
WHERE amount = 13.5
ORDER BY created_at DESC;

-- Range search (13.49 to 13.51)
SELECT 
    'Range 13.49-13.51' as search_type,
    id,
    transaction_type,
    amount,
    description,
    source_type,
    source_id,
    created_at
FROM green_scholar_transactions
WHERE amount BETWEEN 13.49 AND 13.51
ORDER BY created_at DESC;

-- Step 2: Search for PET-related transactions
SELECT '=== ALL PET-RELATED TRANSACTIONS ===' as step;
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

-- Step 3: Search for any transactions with "13" in the amount
SELECT '=== TRANSACTIONS CONTAINING "13" ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    description,
    source_type,
    source_id,
    created_at
FROM green_scholar_transactions
WHERE amount::text LIKE '%13%'
ORDER BY created_at DESC;

-- Step 4: Check all transaction types and amounts
SELECT '=== ALL TRANSACTION TYPES AND AMOUNTS ===' as step;
SELECT 
    transaction_type,
    COUNT(*) as count,
    MIN(amount) as min_amount,
    MAX(amount) as max_amount,
    SUM(amount) as total_amount
FROM green_scholar_transactions
GROUP BY transaction_type
ORDER BY transaction_type;

-- Step 5: Search for transactions with specific descriptions
SELECT '=== TRANSACTIONS WITH PET IN DESCRIPTION ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    description,
    source_type,
    source_id,
    created_at
FROM green_scholar_transactions
WHERE description ILIKE '%pet%' 
   OR description ILIKE '%bottle%'
   OR description ILIKE '%plastic%'
ORDER BY created_at DESC;

-- Step 6: Check fund balance table
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

-- Step 7: Calculate current totals
SELECT '=== CURRENT TOTALS CALCULATION ===' as step;
SELECT 
    'PET Revenue' as type,
    COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) as total
FROM green_scholar_transactions
UNION ALL
SELECT 
    'Direct Donations' as type,
    COALESCE(SUM(CASE WHEN transaction_type IN ('donation', 'direct_donation') THEN amount ELSE 0 END), 0) as total
FROM green_scholar_transactions
UNION ALL
SELECT 
    'Distributions' as type,
    COALESCE(SUM(CASE WHEN transaction_type IN ('distribution', 'expense') THEN amount ELSE 0 END), 0) as total
FROM green_scholar_transactions;

-- Step 8: Check if there are any views or functions creating this data
SELECT '=== CHECKING FOR VIEWS ===' as step;
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname ILIKE '%green_scholar%'
   OR definition ILIKE '%green_scholar%'
   OR definition ILIKE '%pet%';

-- Step 9: Check for any triggers
SELECT '=== CHECKING FOR TRIGGERS ===' as step;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE event_object_table ILIKE '%green_scholar%'
   OR action_statement ILIKE '%green_scholar%';

SELECT '=== SEARCH COMPLETED ===' as result;
