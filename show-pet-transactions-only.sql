-- ============================================================================
-- SHOW ONLY PET TRANSACTIONS - FIND THE R13.50
-- ============================================================================

-- Show only the transactions that contribute to PET revenue
SELECT 
    'PET TRANSACTIONS ONLY' as table_name,
    id,
    transaction_type,
    amount,
    description,
    created_at
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation')
ORDER BY created_at DESC;

-- Show the sum
SELECT 
    'TOTAL PET REVENUE' as calculation,
    COALESCE(SUM(amount), 0) as pet_revenue
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');

-- Show count
SELECT 
    'COUNT OF PET TRANSACTIONS' as info,
    COUNT(*) as count
FROM green_scholar_transactions
WHERE transaction_type IN ('pet_contribution', 'pet_donation');
