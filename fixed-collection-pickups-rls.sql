-- Fixed RLS policies for collection_pickups table with proper type casting
-- This script fixes the UUID/text type mismatch issues

-- ============================================================================
-- STEP 1: ENABLE RLS ON COLLECTION_PICKUPS TABLE
-- ============================================================================

-- Enable RLS on collection_pickups table
ALTER TABLE public.collection_pickups ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP EXISTING POLICIES (IF ANY)
-- ============================================================================

-- Drop any existing policies
DROP POLICY IF EXISTS "collectors_can_insert_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "collectors_can_view_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "collectors_can_update_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "users_can_view_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "users_can_insert_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "users_can_update_collection_pickups" ON public.collection_pickups;

-- ============================================================================
-- STEP 3: CREATE FIXED RLS POLICIES WITH PROPER TYPE CASTING
-- ============================================================================

-- Policy: Allow authenticated users to insert collection_pickups
CREATE POLICY "users_can_insert_collection_pickups" ON public.collection_pickups
  FOR INSERT 
  TO authenticated
  WITH CHECK (true); -- Allow all authenticated users to insert

-- Policy: Allow users to view collection_pickups they're involved in
CREATE POLICY "users_can_view_collection_pickups" ON public.collection_pickups
  FOR SELECT 
  TO authenticated
  USING (
    -- Allow users to view pickups where they are the collector or customer
    -- Cast auth.uid() to text for comparison with text fields
    auth.uid()::text = collector_id::text 
    OR 
    auth.uid()::text = customer_id::text
    OR
    -- Allow viewing if user has admin role (check multiple possible role fields)
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND (
        role_id = 'admin' 
        OR role_id = 'ADMIN'
        OR role_id LIKE '%admin%'
      )
    )
    OR
    -- Allow viewing if user has admin role in user_profiles table
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy: Allow users to update collection_pickups they're involved in
CREATE POLICY "users_can_update_collection_pickups" ON public.collection_pickups
  FOR UPDATE 
  TO authenticated
  USING (
    -- Allow users to update pickups where they are the collector
    auth.uid()::text = collector_id::text
    OR
    -- Allow admins to update any pickup
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND (
        role_id = 'admin' 
        OR role_id = 'ADMIN'
        OR role_id LIKE '%admin%'
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    -- Same conditions for the WITH CHECK clause
    auth.uid()::text = collector_id::text
    OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND (
        role_id = 'admin' 
        OR role_id = 'ADMIN'
        OR role_id LIKE '%admin%'
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 4: CREATE RLS POLICIES FOR PICKUP_ITEMS WITH PROPER TYPE CASTING
-- ============================================================================

-- Enable RLS on pickup_items table
ALTER TABLE public.pickup_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "users_can_manage_pickup_items" ON public.pickup_items;

-- Policy: Allow users to manage pickup_items for their collection_pickups
CREATE POLICY "users_can_manage_pickup_items" ON public.pickup_items
  FOR ALL 
  TO authenticated
  USING (
    -- Allow access if the pickup belongs to the user
    EXISTS (
      SELECT 1 FROM public.collection_pickups 
      WHERE id = pickup_items.pickup_id 
      AND (
        auth.uid()::text = collector_id::text 
        OR 
        auth.uid()::text = customer_id::text
      )
    )
    OR
    -- Allow admins to access all pickup items
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND (
        role_id = 'admin' 
        OR role_id = 'ADMIN'
        OR role_id LIKE '%admin%'
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  )
  WITH CHECK (
    -- Same conditions for the WITH CHECK clause
    EXISTS (
      SELECT 1 FROM public.collection_pickups 
      WHERE id = pickup_items.pickup_id 
      AND (
        auth.uid()::text = collector_id::text 
        OR 
        auth.uid()::text = customer_id::text
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND (
        role_id = 'admin' 
        OR role_id = 'ADMIN'
        OR role_id LIKE '%admin%'
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role = 'admin'
    )
  );

-- ============================================================================
-- STEP 5: GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant permissions on collection_pickups table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collection_pickups TO authenticated;

-- Grant permissions on pickup_items table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pickup_items TO authenticated;

-- Grant permissions on materials table (needed for the collector app)
GRANT SELECT ON public.materials TO authenticated;

-- Grant permissions on users table (needed for role checking)
GRANT SELECT ON public.users TO authenticated;

-- Grant permissions on user_profiles table (if it exists)
GRANT SELECT ON public.user_profiles TO authenticated;

-- ============================================================================
-- STEP 6: VERIFY POLICIES WERE CREATED
-- ============================================================================

-- Check that policies were created successfully
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('collection_pickups', 'pickup_items')
ORDER BY tablename, policyname;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'Fixed RLS policies for collection_pickups and pickup_items have been created successfully!' as status;
