-- ============================================================================
-- FIX ROLE CONSTRAINT IN PROFILES TABLE
-- ============================================================================

-- First, let's see what the current role constraint allows
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c';

-- Check what roles currently exist in the table
SELECT DISTINCT role FROM profiles;

-- Check the exact constraint definition
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'profiles' 
AND tc.constraint_type = 'CHECK'
AND kcu.column_name = 'role';

-- Drop the existing constraint (we'll recreate it)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Create a new constraint that allows our roles
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('ADMIN', 'STAFF', 'COLLECTOR', 'CUSTOMER'));

-- Now try to insert the sample data again
INSERT INTO profiles (id, email, username, first_name, last_name, role, is_active)
VALUES (
  gen_random_uuid(),
  'admin@wozamali.com',
  'admin',
  'System',
  'Administrator',
  'ADMIN',
  true
) ON CONFLICT (email) DO NOTHING;

-- Verify the insert worked
SELECT id, email, username, first_name, last_name, role, is_active 
FROM profiles 
WHERE email = 'admin@wozamali.com';

-- Show all profiles to confirm
SELECT * FROM profiles;
