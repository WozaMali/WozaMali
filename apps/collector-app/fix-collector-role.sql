-- Fix Collector Role Constraint Issue
-- This script fixes the "valid_collector_id" constraint violation

-- 1. Check the current constraint
SELECT 
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_collector_id';

-- 2. Update the user with both role and collector_id
UPDATE profiles 
SET 
    role = 'collector',
    collector_id = id, -- Set collector_id to the user's own ID
    updated_at = NOW()
WHERE email = 'dumisani@wozamali.co.za';

-- 3. Verify the update
SELECT 
    email,
    role,
    collector_id,
    updated_at
FROM profiles 
WHERE email = 'dumisani@wozamali.co.za';
