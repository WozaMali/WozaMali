-- ============================================================================
-- SHOW RAW PET DATA - SIMPLE VERSION
-- ============================================================================

-- Show all PET transactions with raw data
SELECT 
    'RAW PET TRANSACTIONS' as info,
    *
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC;

-- Show count
SELECT 
    'COUNT: ' || COUNT(*) as info
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');

-- Show sum
SELECT 
    'SUM: ' || COALESCE(SUM(amount), 0)::text as info
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');
