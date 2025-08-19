-- Diagnose User Creation Issues
-- Run this in your Supabase SQL Editor to identify the problem

-- 1. Check if the trigger exists and is working
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. Check if the handle_new_user function exists
SELECT 
  routine_name,
  routine_type,
  data_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. Check table structure for profiles
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 4. Check table structure for wallets
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'wallets' 
ORDER BY ordinal_position;

-- 5. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('profiles', 'wallets');

-- 6. Check for any existing data inconsistencies
SELECT 
  'profiles' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN email IS NULL THEN 1 END) as null_emails,
  COUNT(CASE WHEN full_name IS NULL THEN 1 END) as null_names,
  COUNT(CASE WHEN status IS NULL THEN 1 END) as null_status
FROM public.profiles
UNION ALL
SELECT 
  'wallets' as table_name,
  COUNT(*) as total_rows,
  COUNT(CASE WHEN user_id IS NULL THEN 1 END) as null_user_ids,
  COUNT(CASE WHEN balance IS NULL THEN 1 END) as null_balance,
  COUNT(CASE WHEN tier IS NULL THEN 1 END) as null_tier
FROM public.wallets;

-- 7. Check if there are any constraint violations
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.profiles'::regclass
   OR conrelid = 'public.wallets'::regclass;

-- 8. Check for any recent errors in the logs (if accessible)
-- Note: This might not work in all Supabase setups
SELECT 
  log_time,
  user_name,
  database_name,
  process_id,
  session_id,
  command_tag,
  message
FROM pg_stat_activity 
WHERE state = 'active' 
  AND query LIKE '%error%'
ORDER BY log_time DESC;

-- 9. Test basic insert operations
-- Try inserting a test profile (this will help identify the exact issue)
DO $$
DECLARE
  test_id UUID := gen_random_uuid();
  insert_result TEXT;
BEGIN
  BEGIN
    INSERT INTO public.profiles (
      id,
      email,
      full_name,
      status
    ) VALUES (
      test_id,
      'test@example.com',
      'Test User',
      'active'
    );
    
    insert_result := 'Profile insert: SUCCESS';
    
    -- Clean up
    DELETE FROM public.profiles WHERE id = test_id;
    
  EXCEPTION
    WHEN OTHERS THEN
      insert_result := 'Profile insert: FAILED - ' || SQLERRM;
  END;
  
  RAISE NOTICE '%', insert_result;
END $$;

-- 10. Check if the service_role has proper permissions
SELECT 
  grantee,
  table_name,
  privilege_type,
  is_grantable
FROM information_schema.table_privileges 
WHERE table_name IN ('profiles', 'wallets')
  AND grantee IN ('service_role', 'authenticated', 'anon');

-- 11. Verify the auth.users table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND table_schema = 'auth'
ORDER BY ordinal_position;

-- 12. Check if there are any pending transactions or locks
SELECT 
  pid,
  usename,
  application_name,
  client_addr,
  backend_start,
  state,
  query
FROM pg_stat_activity 
WHERE state != 'idle'
  AND query NOT LIKE '%pg_stat_activity%';

-- After running these diagnostics:
-- 1. Look for any ERROR messages in the output
-- 2. Check if the trigger and function exist
-- 3. Verify table structures are correct
-- 4. Check RLS policies are properly configured
-- 5. Look for constraint violations
-- 6. Test basic insert operations

-- Common issues to look for:
-- ❌ Missing trigger or function
-- ❌ Incorrect table structure
-- ❌ RLS policies blocking inserts
-- ❌ Constraint violations
-- ❌ Permission issues
-- ❌ Data type mismatches
