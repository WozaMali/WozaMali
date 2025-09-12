-- Check the constraints on the wallets table
-- Run this in your Supabase SQL editor

-- Check all constraints on the wallets table
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'wallets'::regclass;

-- Check the specific check constraint for tier
SELECT 
  conname,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'wallets'::regclass 
  AND contype = 'c' 
  AND conname LIKE '%tier%';
