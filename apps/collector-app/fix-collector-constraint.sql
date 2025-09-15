-- Fix Collector Constraint Issue
-- This script addresses the "valid_collector_id" check constraint violation

-- 1. First, let's examine the current constraint
SELECT 
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_collector_id';

-- 2. Check the current user's profile structure
SELECT 
    id,
    email,
    role,
    collector_id,
    is_active,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'dumisani@wozamali.co.za';

-- 3. Check what the constraint expects
-- This will show us the exact constraint definition
SELECT 
    conname,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_collector_id';

-- 4. Option A: Update the user with a valid collector_id
-- If the constraint requires a collector_id for collector role
UPDATE profiles 
SET 
    role = 'collector',
    collector_id = id, -- Use the user's own ID as collector_id
    updated_at = NOW()
WHERE email = 'dumisani@wozamali.co.za';

-- 5. Option B: If the constraint is too restrictive, we can temporarily disable it
-- (Uncomment if Option A doesn't work)
/*
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_collector_id;

-- Update the user role
UPDATE profiles 
SET 
    role = 'collector',
    updated_at = NOW()
WHERE email = 'dumisani@wozamali.co.za';

-- Recreate a more flexible constraint
ALTER TABLE profiles ADD CONSTRAINT valid_collector_id 
CHECK (
    (role = 'collector' AND collector_id IS NOT NULL) OR
    (role != 'collector')
);
*/

-- 6. Verify the update worked
SELECT 
    id,
    email,
    role,
    collector_id,
    is_active,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'dumisani@wozamali.co.za';

-- 7. Check all collector profiles to see the pattern
SELECT 
    id,
    email,
    role,
    collector_id,
    is_active
FROM profiles 
WHERE role = 'collector'
ORDER BY created_at DESC;
