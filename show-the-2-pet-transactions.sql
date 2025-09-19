-- ============================================================================
-- SHOW THE 2 PET TRANSACTIONS THAT MAKE UP R13.50
-- ============================================================================

-- Show the 2 PET transactions with full details
SELECT 
    'PET TRANSACTION #1' as transaction_number,
    id,
    transaction_type,
    amount,
    description,
    source_type,
    source_id,
    created_at
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC
LIMIT 1;

SELECT 
    'PET TRANSACTION #2' as transaction_number,
    id,
    transaction_type,
    amount,
    description,
    source_type,
    source_id,
    created_at
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC
OFFSET 1
LIMIT 1;

-- Show both transactions together
SELECT 
    'BOTH PET TRANSACTIONS' as info,
    id,
    transaction_type,
    amount,
    description,
    created_at
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC;

-- Show the math: how these 2 transactions add up to R13.50
SELECT 
    'MATH BREAKDOWN' as info,
    amount,
    'Transaction amount: ' || amount::text as amount_text
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC;

-- Show the sum to confirm it equals R13.50
SELECT 
    'TOTAL SUM' as info,
    COALESCE(SUM(amount), 0) as total_amount,
    'Should equal 13.50' as expected
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');

-- Show individual amounts and their sum
SELECT 
    'INDIVIDUAL AMOUNTS' as info,
    string_agg(amount::text, ' + ') as individual_amounts,
    COALESCE(SUM(amount), 0) as total_sum
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');
