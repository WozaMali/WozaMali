-- Fix RLS permissions for collection_pickups table
-- This script creates proper Row Level Security policies for the collection_pickups table

-- ============================================================================
-- STEP 1: ENABLE RLS ON COLLECTION_PICKUPS TABLE
-- ============================================================================

-- Enable RLS on collection_pickups table
ALTER TABLE public.collection_pickups ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: CREATE RLS POLICIES FOR COLLECTION_PICKUPS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "collectors_can_insert_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "collectors_can_view_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "customers_can_view_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "admins_can_manage_collection_pickups" ON public.collection_pickups;

-- Policy: Collectors can insert collection_pickups
CREATE POLICY "collectors_can_insert_collection_pickups" ON public.collection_pickups
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    -- Allow collectors to insert pickups where they are the collector
    auth.uid() = collector_id
    OR
    -- Allow admins to insert any pickup
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role_id IN (
        SELECT id FROM public.roles WHERE name = 'admin'
      )
    )
  );

-- Policy: Collectors can view their own collection_pickups
CREATE POLICY "collectors_can_view_collection_pickups" ON public.collection_pickups
  FOR SELECT 
  TO authenticated
  USING (
    -- Allow collectors to view pickups they're assigned to
    auth.uid() = collector_id
    OR
    -- Allow customers to view their own pickups
    auth.uid() = customer_id
    OR
    -- Allow admins to view all pickups
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role_id IN (
        SELECT id FROM public.roles WHERE name = 'admin'
      )
    )
  );

-- Policy: Collectors can update their own collection_pickups
CREATE POLICY "collectors_can_update_collection_pickups" ON public.collection_pickups
  FOR UPDATE 
  TO authenticated
  USING (
    -- Allow collectors to update pickups they're assigned to
    auth.uid() = collector_id
    OR
    -- Allow admins to update any pickup
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role_id IN (
        SELECT id FROM public.roles WHERE name = 'admin'
      )
    )
  )
  WITH CHECK (
    -- Same conditions for the WITH CHECK clause
    auth.uid() = collector_id
    OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role_id IN (
        SELECT id FROM public.roles WHERE name = 'admin'
      )
    )
  );

-- ============================================================================
-- STEP 3: CREATE RLS POLICIES FOR PICKUP_ITEMS
-- ============================================================================

-- Enable RLS on pickup_items table
ALTER TABLE public.pickup_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "collectors_can_manage_pickup_items" ON public.pickup_items;
DROP POLICY IF EXISTS "users_can_view_pickup_items" ON public.pickup_items;

-- Policy: Users can manage pickup_items for their collection_pickups
CREATE POLICY "collectors_can_manage_pickup_items" ON public.pickup_items
  FOR ALL 
  TO authenticated
  USING (
    -- Allow access if the pickup belongs to the user
    EXISTS (
      SELECT 1 FROM public.collection_pickups 
      WHERE id = pickup_items.pickup_id 
      AND (collector_id = auth.uid() OR customer_id = auth.uid())
    )
    OR
    -- Allow admins to access all pickup items
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role_id IN (
        SELECT id FROM public.roles WHERE name = 'admin'
      )
    )
  )
  WITH CHECK (
    -- Same conditions for the WITH CHECK clause
    EXISTS (
      SELECT 1 FROM public.collection_pickups 
      WHERE id = pickup_items.pickup_id 
      AND (collector_id = auth.uid() OR customer_id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role_id IN (
        SELECT id FROM public.roles WHERE name = 'admin'
      )
    )
  );

-- ============================================================================
-- STEP 4: GRANT NECESSARY PERMISSIONS
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

-- Grant permissions on roles table (needed for role checking)
GRANT SELECT ON public.roles TO authenticated;

-- ============================================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is a collector
CREATE OR REPLACE FUNCTION is_collector()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.name = 'collector'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.name = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('collection_pickups', 'pickup_items')
ORDER BY tablename, policyname;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'RLS policies for collection_pickups and pickup_items have been created successfully!' as status;
