-- ============================================================================
-- SIMPLE RESET: Remove R13.50 from Green Scholar Fund PET Revenue
-- ============================================================================

-- Step 1: Remove R13.50 PET transactions
DELETE FROM green_scholar_transactions 
WHERE amount = 13.50 
  AND transaction_type IN ('pet_contribution', 'pet_donation');

-- Step 2: Update fund balance to reflect the removal
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

-- Step 3: Verify the result
SELECT 
    'PET Revenue after reset:' as description,
    COALESCE(SUM(CASE WHEN transaction_type IN ('pet_contribution', 'pet_donation') THEN amount ELSE 0 END), 0) as pet_revenue
FROM green_scholar_transactions;
