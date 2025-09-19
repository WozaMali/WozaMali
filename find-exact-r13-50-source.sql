-- ============================================================================
-- FIND EXACT SOURCE OF R13.50 PET REVENUE
-- ============================================================================

-- Step 1: Show ALL transactions in green_scholar_transactions
SELECT '=== ALL GREEN SCHOLAR TRANSACTIONS ===' as step;
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

-- Step 2: Show only PET transactions with their exact amounts
SELECT '=== PET TRANSACTIONS WITH EXACT AMOUNTS ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    description,
    created_at,
    'Amount: ' || amount::text as amount_text
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC;

-- Step 3: Calculate PET revenue step by step
SELECT '=== STEP-BY-STEP PET REVENUE CALCULATION ===' as step;

-- Show each PET transaction and its contribution
SELECT 
    id,
    transaction_type,
    amount,
    description,
    'This transaction contributes: ' || amount::text as contribution
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY amount DESC;

-- Step 4: Check for any hidden characters or formatting issues
SELECT '=== CHECKING FOR HIDDEN CHARACTERS ===' as step;
SELECT 
    id,
    transaction_type,
    amount,
    length(amount::text) as amount_length,
    ascii(substring(amount::text, 1, 1)) as first_char_ascii,
    ascii(substring(amount::text, -1, 1)) as last_char_ascii,
    description
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY amount DESC;

-- Step 5: Check if there are any views or materialized views
SELECT '=== CHECKING FOR VIEWS ===' as step;
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname ILIKE '%green_scholar%'
   OR definition ILIKE '%green_scholar%';

-- Step 6: Check for any functions that might be calculating this
SELECT '=== CHECKING FOR FUNCTIONS ===' as step;
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_definition ILIKE '%green_scholar%'
   OR routine_definition ILIKE '%pet%';

-- Step 7: Check the fund balance table structure
SELECT '=== FUND BALANCE TABLE STRUCTURE ===' as step;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'green_scholar_fund_balance'
ORDER BY ordinal_position;

-- Step 8: Show the exact fund balance values
SELECT '=== EXACT FUND BALANCE VALUES ===' as step;
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

-- Step 9: Check if there are any triggers on the tables
SELECT '=== CHECKING FOR TRIGGERS ===' as step;
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table IN ('green_scholar_transactions', 'green_scholar_fund_balance');

-- Step 10: Final verification - show the exact calculation
SELECT '=== FINAL VERIFICATION ===' as step;
SELECT 
    'Total PET transactions: ' || COUNT(*) as info
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
UNION ALL
SELECT 
    'Sum of PET amounts: ' || COALESCE(SUM(amount), 0)::text as info
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
UNION ALL
SELECT 
    'Fund balance PET total: ' || COALESCE(pet_donations_total, 0)::text as info
FROM green_scholar_fund_balance
ORDER BY created_at DESC
LIMIT 1;

SELECT '=== SEARCH COMPLETED ===' as result;
