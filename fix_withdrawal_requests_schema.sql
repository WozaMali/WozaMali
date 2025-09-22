-- Fix withdrawal_requests table schema to match WithdrawalService expectations
-- This migration updates the table structure to use individual fields instead of JSONB

-- First, let's check the current structure
SELECT 'Current withdrawal_requests structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'withdrawal_requests' 
ORDER BY ordinal_position;

-- Add new columns if they don't exist
ALTER TABLE withdrawal_requests 
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS owner_name TEXT,
ADD COLUMN IF NOT EXISTS account_type TEXT,
ADD COLUMN IF NOT EXISTS branch_code TEXT,
ADD COLUMN IF NOT EXISTS payout_method TEXT CHECK (payout_method IN ('wallet', 'cash', 'bank_transfer', 'mobile_money')),
ADD COLUMN IF NOT EXISTS processed_by TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migrate existing data from withdrawal_method to payout_method
-- Since account_details doesn't exist, we'll just set default values for new fields

-- Update payout_method based on withdrawal_method for existing records
UPDATE withdrawal_requests 
SET payout_method = CASE 
  WHEN withdrawal_method = 'bank_transfer' THEN 'bank_transfer'
  WHEN withdrawal_method = 'mobile_money' THEN 'mobile_money'
  WHEN withdrawal_method = 'paypal' THEN 'wallet'
  WHEN withdrawal_method = 'crypto' THEN 'wallet'
  ELSE 'bank_transfer'
END
WHERE payout_method IS NULL;

-- Make the new columns NOT NULL where appropriate (after data migration)
-- Note: We'll keep them nullable for now to avoid issues with existing data

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);

-- Update RLS policies to include new columns
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON withdrawal_requests;
DROP POLICY IF EXISTS "Users can insert own withdrawal requests" ON withdrawal_requests;

-- Recreate policies
CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawal requests" ON withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add admin policies for Office App
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

-- Show sample data to verify migration
SELECT 'Sample withdrawal data after migration:' as info;
SELECT id, user_id, amount, bank_name, account_number, owner_name, status, payout_method, created_at
FROM withdrawal_requests 
LIMIT 5;
