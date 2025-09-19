-- ============================================================================
-- CLEANUP TEST REWARDS DATA
-- ============================================================================
-- Run this script AFTER testing to remove the sample rewards data
-- This keeps the table structure but removes the test data

-- Delete all test rewards (be careful with this!)
DELETE FROM public.rewards 
WHERE name IN (
    'R50 Cash Back',
    'R100 Cash Back', 
    'R200 Cash Back',
    'Free Collection Service',
    'Premium Collection Service',
    'Eco-Friendly Water Bottle',
    'Recycling Kit',
    'R50 Voucher',
    'R100 Voucher',
    'R200 Voucher'
);

-- Verify cleanup
SELECT 'Test rewards data cleaned up!' as status;
SELECT COUNT(*) as remaining_rewards FROM public.rewards;

-- Show any remaining rewards (should be 0 if only test data existed)
SELECT name, category, points_required FROM public.rewards ORDER BY created_at;
