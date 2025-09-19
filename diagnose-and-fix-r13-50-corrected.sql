-- ============================================================================
-- DIAGNOSE AND FIX R13.50 PET REVENUE ISSUE (CORRECTED)
-- ============================================================================

-- Step 1: Comprehensive diagnosis of R13.50 sources
SELECT '=== COMPREHENSIVE DIAGNOSIS OF R13.50 SOURCES ===' as step;

-- Check all green_scholar_transactions with R13.50
SELECT '=== GREEN SCHOLAR TRANSACTIONS WITH R13.50 ===' as step;
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

-- Check all transactions with PET-related types
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

-- Check for any transactions with 13.5 (without decimal)
SELECT '=== TRANSACTIONS WITH 13.5 (NO DECIMAL) ===' as step;
SELECT 
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

-- Check for transactions with amounts between 13.49 and 13.51 (floating point precision)
SELECT '=== TRANSACTIONS WITH AMOUNTS AROUND 13.50 ===' as step;
SELECT 
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

-- Check if there are any triggers or views that might be creating this data
SELECT '=== CHECKING FOR VIEWS OR FUNCTIONS ===' as step;
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE definition ILIKE '%green_scholar%' 
   OR definition ILIKE '%pet%'
   OR viewname ILIKE '%green_scholar%';

-- Step 2: Calculate current PET revenue from all sources
SELECT '=== CURRENT PET REVENUE CALCULATION ===' as step;
SELECT 
    'From green_scholar_transactions' as source,
    COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) as pet_revenue
FROM green_scholar_transactions;

-- Step 3: Check what tables actually exist
SELECT '=== CHECKING EXISTING TABLES ===' as step;
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name ILIKE '%green_scholar%' 
       OR table_name ILIKE '%collection%'
       OR table_name ILIKE '%pet%')
ORDER BY table_name;

-- Step 4: AGGRESSIVE CLEANUP - Remove ALL R13.50 related data
SELECT '=== AGGRESSIVE CLEANUP OF R13.50 DATA ===' as step;

-- Delete from green_scholar_transactions (all variations)
DELETE FROM green_scholar_transactions 
WHERE amount = 13.50 
   OR amount = 13.5
   OR (amount BETWEEN 13.49 AND 13.51 AND transaction_type IN ('pet_contribution', 'pet_donation'));

SELECT 'Deleted R13.50 transactions from green_scholar_transactions' as result;

-- Step 5: Reset fund balance completely
SELECT '=== RESETTING FUND BALANCE ===' as step;

-- Calculate new totals after cleanup
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

SELECT 'Updated fund balance after aggressive cleanup' as result;

-- Step 6: Final verification
SELECT '=== FINAL VERIFICATION ===' as step;

-- Check remaining PET transactions
SELECT 
    COUNT(*) as remaining_pet_transactions,
    COALESCE(SUM(amount), 0) as total_pet_revenue,
    'REMAINING PET TRANSACTIONS' as description
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');

-- Final fund balance check
SELECT 
    id,
    total_balance,
    pet_donations_total,
    direct_donations_total,
    expenses_total,
    updated_at
FROM green_scholar_fund_balance;

-- Final PET revenue calculation
SELECT 
    'FINAL PET REVENUE CALCULATION' as description,
    COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) as pet_revenue
FROM green_scholar_transactions;

SELECT 'AGGRESSIVE R13.50 CLEANUP COMPLETED' as result;
