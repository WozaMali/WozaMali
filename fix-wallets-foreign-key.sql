-- ============================================================================
-- FIX WALLETS FOREIGN KEY CONSTRAINT
-- ============================================================================
-- This script fixes the foreign key constraint to reference the correct table

-- ============================================================================
-- STEP 1: DROP THE INCORRECT FOREIGN KEY CONSTRAINT
-- ============================================================================
-- Remove the existing foreign key that references the wrong table

ALTER TABLE wallets DROP CONSTRAINT IF EXISTS wallets_user_id_fkey;

-- ============================================================================
-- STEP 2: ADD THE CORRECT FOREIGN KEY CONSTRAINT
-- ============================================================================
-- Add the foreign key that references the profiles table

ALTER TABLE wallets 
ADD CONSTRAINT wallets_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ============================================================================
-- STEP 3: VERIFY THE CONSTRAINT
-- ============================================================================
-- Check that the constraint is now correct

SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'wallets'::regclass 
  AND conname = 'wallets_user_id_fkey';

-- ============================================================================
-- STEP 4: CREATE DEFAULT WALLETS FOR EXISTING USERS
-- ============================================================================
-- Now create default wallets for users who don't have one

INSERT INTO wallets (user_id, balance, total_points, tier)
SELECT 
  p.id,
  0.00,
  0,
  'bronze'
FROM profiles p
LEFT JOIN wallets w ON p.id = w.user_id
WHERE w.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;
