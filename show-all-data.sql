-- ============================================================================
-- SHOW ALL DATA - SIMPLE VERSION
-- ============================================================================

-- Show all green_scholar_transactions
SELECT 'ALL TRANSACTIONS' as table_name;
SELECT * FROM green_scholar_transactions ORDER BY created_at DESC;

-- Show fund balance
SELECT 'FUND BALANCE' as table_name;
SELECT * FROM green_scholar_fund_balance ORDER BY created_at DESC;

-- Show PET revenue calculation
SELECT 'PET REVENUE CALCULATION' as calculation;
SELECT 
    COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) as pet_revenue
FROM green_scholar_transactions;
