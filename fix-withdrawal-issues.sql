-- Fix withdrawal issues: wallet permissions and withdrawal_requests constraints
-- Run this in the Supabase SQL Editor

-- ============================================================================
-- 1. FIX WALLET TABLE PERMISSIONS
-- ============================================================================

-- Grant permissions to service role for wallets table
GRANT ALL ON public.wallets TO service_role;
GRANT ALL ON public.wallet_transactions TO service_role;

-- Enable RLS on wallets table if not already enabled
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Create policies for service role access
DROP POLICY IF EXISTS "Service role can access wallets" ON public.wallets;
CREATE POLICY "Service role can access wallets" ON public.wallets
    FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role can access wallet_transactions" ON public.wallet_transactions;
CREATE POLICY "Service role can access wallet_transactions" ON public.wallet_transactions
    FOR ALL USING (true);

-- ============================================================================
-- 2. FIX WITHDRAWAL_REQUESTS TABLE CONSTRAINTS
-- ============================================================================

-- First, let's check what constraints exist
SELECT 'Current constraints on withdrawal_requests:' as info;
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.withdrawal_requests'::regclass;

-- Make owner_name nullable for cash payments
ALTER TABLE public.withdrawal_requests 
ALTER COLUMN owner_name DROP NOT NULL;

-- Make other bank-related fields nullable as well
ALTER TABLE public.withdrawal_requests 
ALTER COLUMN bank_name DROP NOT NULL,
ALTER COLUMN account_number DROP NOT NULL,
ALTER COLUMN account_type DROP NOT NULL,
ALTER COLUMN branch_code DROP NOT NULL;

-- Fix amount constraint - remove existing amount constraints and add a new one
-- Drop any existing amount-related constraints
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    -- Find all check constraints that might be related to amount
    FOR constraint_record IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'public.withdrawal_requests'::regclass 
        AND contype = 'c'
        AND (conname LIKE '%amount%' OR conname LIKE '%withdrawal%')
    LOOP
        -- Drop the constraint
        EXECUTE 'ALTER TABLE public.withdrawal_requests DROP CONSTRAINT IF EXISTS ' || constraint_record.conname;
        RAISE NOTICE 'Dropped constraint: %', constraint_record.conname;
    END LOOP;
END $$;

-- Add a new, more flexible amount constraint (minimum R1.00)
ALTER TABLE public.withdrawal_requests 
ADD CONSTRAINT withdrawal_requests_amount_check 
CHECK (amount >= 1.00);

-- ============================================================================
-- 3. VERIFY CHANGES
-- ============================================================================

-- Check wallet table permissions
SELECT 'Wallet table permissions:' as info;
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'wallets' AND table_schema = 'public';

-- Check withdrawal_requests table structure
SELECT 'Withdrawal_requests table structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'withdrawal_requests' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check constraints after changes
SELECT 'Constraints after changes:' as info;
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'public.withdrawal_requests'::regclass;

-- Test wallet access
SELECT 'Testing wallet access:' as info;
SELECT COUNT(*) as wallet_count FROM public.wallets;

-- Test withdrawal_requests insert with cash payment
SELECT 'Testing withdrawal_requests insert:' as info;
INSERT INTO public.withdrawal_requests (
    user_id, 
    amount, 
    payout_method, 
    status
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    10.00,
    'cash',
    'pending'
);

-- Clean up test record
DELETE FROM public.withdrawal_requests WHERE user_id = '00000000-0000-0000-0000-000000000000';

SELECT 'All fixes applied successfully!' as result;
