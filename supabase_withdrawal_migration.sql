-- Supabase Migration: Fix withdrawal_requests table schema
-- Run this in the Supabase SQL Editor

-- First, let's check the current table structure
SELECT 'Current withdrawal_requests structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'withdrawal_requests' 
ORDER BY ordinal_position;

-- Add missing columns to support the WithdrawalService
ALTER TABLE withdrawal_requests 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS branch_code TEXT,
ADD COLUMN IF NOT EXISTS payout_method TEXT CHECK (payout_method IN ('bank_transfer', 'cash')),
ADD COLUMN IF NOT EXISTS processed_by TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);

-- Update RLS policies to include new columns
-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can insert own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Admins can update withdrawal requests" ON withdrawal_requests;

-- Recreate policies
CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawal requests" ON withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all withdrawal requests" ON withdrawal_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update withdrawal requests" ON withdrawal_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- Verify the updated structure
SELECT 'Updated withdrawal_requests structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'withdrawal_requests' 
ORDER BY ordinal_position;

-- Test insert to verify the schema works
INSERT INTO withdrawal_requests (
    user_id, 
    amount, 
    bank_name, 
    account_number, 
    owner_name, 
    account_type, 
    branch_code, 
    payout_method, 
    status
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    50.00,
    'Test Bank',
    '123456789',
    'Test User',
    'Savings Account',
    '123456',
    'bank_transfer',
    'pending'
);

-- Clean up test record
DELETE FROM withdrawal_requests WHERE user_id = '00000000-0000-0000-0000-000000000000';

SELECT 'Migration completed successfully!' as result;
