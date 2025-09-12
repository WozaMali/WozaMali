-- Fix RLS policies for withdrawal_requests table to allow Office App access
-- This script adds admin policies so the Office App can see all withdrawal requests

-- First, check current policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'withdrawal_requests'
AND schemaname = 'public';

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS withdrawal_requests_read_own ON public.withdrawal_requests;
DROP POLICY IF EXISTS withdrawal_requests_insert_own ON public.withdrawal_requests;
DROP POLICY IF EXISTS withdrawal_requests_admin_read ON public.withdrawal_requests;

-- Create comprehensive RLS policies
-- 1. Users can read their own withdrawal requests
CREATE POLICY withdrawal_requests_read_own
  ON public.withdrawal_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Users can insert their own withdrawal requests
CREATE POLICY withdrawal_requests_insert_own
  ON public.withdrawal_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. Admin users can read all withdrawal requests (for Office App)
CREATE POLICY withdrawal_requests_admin_read
  ON public.withdrawal_requests
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is admin (check user_profiles table)
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'admin'
    )
    OR
    -- Allow if user is super_admin
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'super_admin'
    )
    OR
    -- Allow if user is staff
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role = 'staff'
    )
  );

-- 4. Admin users can update withdrawal requests (for Office App)
CREATE POLICY withdrawal_requests_admin_update
  ON public.withdrawal_requests
  FOR UPDATE
  TO authenticated
  USING (
    -- Allow if user is admin, super_admin, or staff
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin', 'staff')
    )
  )
  WITH CHECK (
    -- Allow if user is admin, super_admin, or staff
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_profiles.id = auth.uid() 
      AND user_profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Grant additional permissions
GRANT SELECT, INSERT, UPDATE ON public.withdrawal_requests TO authenticated;

-- Verify the policies were created
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'withdrawal_requests'
AND schemaname = 'public'
ORDER BY policyname;
