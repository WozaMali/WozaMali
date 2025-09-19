-- ============================================================================
-- FORCE RESET GREEN SCHOLAR FUND TO ZERO
-- ============================================================================
-- Nuclear option: Force all Green Scholar Fund values to zero

-- Step 1: Delete ALL green_scholar_transactions
DELETE FROM green_scholar_transactions;
SELECT 'Deleted ALL green_scholar_transactions' as result;

-- Step 2: Delete ALL collection_green_scholar_contributions
DELETE FROM collection_green_scholar_contributions;
SELECT 'Deleted ALL collection_green_scholar_contributions' as result;

-- Step 3: Force fund balance to zero
UPDATE green_scholar_fund_balance 
SET 
    total_balance = 0.00,
    pet_donations_total = 0.00,
    direct_donations_total = 0.00,
    expenses_total = 0.00,
    updated_at = NOW()
WHERE id IS NOT NULL;

SELECT 'Forced fund balance to zero' as result;

-- Step 4: Verify complete reset
SELECT 
    'VERIFICATION - All values should be 0' as description,
    (SELECT COUNT(*) FROM green_scholar_transactions) as remaining_transactions,
    (SELECT COUNT(*) FROM collection_green_scholar_contributions) as remaining_contributions,
    (SELECT total_balance FROM green_scholar_fund_balance LIMIT 1) as fund_balance,
    (SELECT pet_donations_total FROM green_scholar_fund_balance LIMIT 1) as pet_revenue;

SELECT 'GREEN SCHOLAR FUND FORCE RESET COMPLETED' as result;
