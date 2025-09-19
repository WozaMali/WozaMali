-- ============================================================================
-- Reset All User Wallets - Complete Reset
-- This script resets wallet balance for ALL users by clearing the source tables
-- ============================================================================

-- WARNING: This will reset ALL user wallets to zero!
-- Make sure you have a backup before running this script.

-- ============================================================================
-- 1. Clear Primary Wallet Calculation Tables
-- ============================================================================

-- Clear unified_collections table (main source of wallet balance)
-- Note: This table might not exist, so we'll try to clear it
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_collections') THEN
        DELETE FROM unified_collections;
        RAISE NOTICE 'Cleared unified_collections table';
    ELSE
        RAISE NOTICE 'unified_collections table does not exist, skipping...';
    END IF;
END $$;

-- Clear wallet_update_queue table (fallback source)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_update_queue') THEN
        DELETE FROM wallet_update_queue;
        RAISE NOTICE 'Cleared wallet_update_queue table';
    ELSE
        RAISE NOTICE 'wallet_update_queue table does not exist, skipping...';
    END IF;
END $$;

-- ============================================================================
-- 2. Clear Legacy Tables (Optional but Recommended)
-- ============================================================================

-- Clear legacy collections table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collections') THEN
        DELETE FROM collections;
        RAISE NOTICE 'Cleared collections table';
    ELSE
        RAISE NOTICE 'collections table does not exist, skipping...';
    END IF;
END $$;

-- Clear legacy pickups table  
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickups') THEN
        DELETE FROM pickups;
        RAISE NOTICE 'Cleared pickups table';
    ELSE
        RAISE NOTICE 'pickups table does not exist, skipping...';
    END IF;
END $$;

-- ============================================================================
-- 3. Reset Wallet Tables
-- ============================================================================

-- Reset wallets table (the actual wallet table)
UPDATE wallets SET 
  balance = 0,
  total_points = 0,
  tier = 'bronze';

-- ============================================================================
-- 4. Clear Transaction History Tables
-- ============================================================================

-- Clear wallet_transactions table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') THEN
        DELETE FROM wallet_transactions;
        RAISE NOTICE 'Cleared wallet_transactions table';
    ELSE
        RAISE NOTICE 'wallet_transactions table does not exist, skipping...';
    END IF;
END $$;

-- Clear withdrawal_requests table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawal_requests') THEN
        DELETE FROM withdrawal_requests;
        RAISE NOTICE 'Cleared withdrawal_requests table';
    ELSE
        RAISE NOTICE 'withdrawal_requests table does not exist, skipping...';
    END IF;
END $$;

-- Clear legacy withdrawals table
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawals') THEN
        DELETE FROM withdrawals;
        RAISE NOTICE 'Cleared withdrawals table';
    ELSE
        RAISE NOTICE 'withdrawals table does not exist, skipping...';
    END IF;
END $$;

-- ============================================================================
-- 5. Clear Donation and Rewards Tables
-- ============================================================================

-- Clear user donations
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_donations') THEN
        DELETE FROM user_donations;
        RAISE NOTICE 'Cleared user_donations table';
    ELSE
        RAISE NOTICE 'user_donations table does not exist, skipping...';
    END IF;
END $$;

-- Clear user rewards
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_rewards') THEN
        DELETE FROM user_rewards;
        RAISE NOTICE 'Cleared user_rewards table';
    ELSE
        RAISE NOTICE 'user_rewards table does not exist, skipping...';
    END IF;
END $$;

-- ============================================================================
-- 6. Verification Queries
-- ============================================================================

-- Check that all tables are empty (only check tables that exist)
DO $$ 
DECLARE
    table_exists boolean;
    result_text text := '';
BEGIN
    -- Check unified_collections
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'unified_collections') INTO table_exists;
    IF table_exists THEN
        SELECT 'unified_collections' as table_name, COUNT(*) as record_count FROM unified_collections INTO result_text;
        RAISE NOTICE 'unified_collections: % records', result_text;
    END IF;
    
    -- Check wallet_update_queue
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_update_queue') INTO table_exists;
    IF table_exists THEN
        SELECT 'wallet_update_queue' as table_name, COUNT(*) as record_count FROM wallet_update_queue INTO result_text;
        RAISE NOTICE 'wallet_update_queue: % records', result_text;
    END IF;
    
    -- Check collections
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collections') INTO table_exists;
    IF table_exists THEN
        SELECT 'collections' as table_name, COUNT(*) as record_count FROM collections INTO result_text;
        RAISE NOTICE 'collections: % records', result_text;
    END IF;
    
    -- Check pickups
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickups') INTO table_exists;
    IF table_exists THEN
        SELECT 'pickups' as table_name, COUNT(*) as record_count FROM pickups INTO result_text;
        RAISE NOTICE 'pickups: % records', result_text;
    END IF;
    
    -- Check wallet_transactions
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wallet_transactions') INTO table_exists;
    IF table_exists THEN
        SELECT 'wallet_transactions' as table_name, COUNT(*) as record_count FROM wallet_transactions INTO result_text;
        RAISE NOTICE 'wallet_transactions: % records', result_text;
    END IF;
    
    -- Check withdrawal_requests
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'withdrawal_requests') INTO table_exists;
    IF table_exists THEN
        SELECT 'withdrawal_requests' as table_name, COUNT(*) as record_count FROM withdrawal_requests INTO result_text;
        RAISE NOTICE 'withdrawal_requests: % records', result_text;
    END IF;
    
    -- Check user_donations
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_donations') INTO table_exists;
    IF table_exists THEN
        SELECT 'user_donations' as table_name, COUNT(*) as record_count FROM user_donations INTO result_text;
        RAISE NOTICE 'user_donations: % records', result_text;
    END IF;
    
    -- Check user_rewards
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_rewards') INTO table_exists;
    IF table_exists THEN
        SELECT 'user_rewards' as table_name, COUNT(*) as record_count FROM user_rewards INTO result_text;
        RAISE NOTICE 'user_rewards: % records', result_text;
    END IF;
END $$;

-- Check wallet balances are reset
SELECT 
  'wallets' as table_name,
  COUNT(*) as total_users,
  SUM(balance) as total_balance,
  SUM(total_points) as total_points
FROM wallets;

-- ============================================================================
-- 7. Success Message
-- ============================================================================

-- This will show a success message
SELECT 'SUCCESS: All user wallets have been reset to zero!' as status;
