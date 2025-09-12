-- Very permissive RLS policies for collection_pickups table
-- This allows any authenticated user to perform any operation for testing

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES
-- ============================================================================

-- Drop all existing policies on collection_pickups
DROP POLICY IF EXISTS "collectors_can_insert_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "collectors_can_view_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "collectors_can_update_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "users_can_view_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "users_can_insert_collection_pickups" ON public.collection_pickups;
DROP POLICY IF EXISTS "users_can_update_collection_pickups" ON public.collection_pickups;

-- Drop all existing policies on pickup_items
DROP POLICY IF EXISTS "users_can_manage_pickup_items" ON public.pickup_items;
DROP POLICY IF EXISTS "collectors_can_manage_pickup_items" ON public.pickup_items;

-- ============================================================================
-- STEP 2: CREATE VERY PERMISSIVE POLICIES FOR TESTING
-- ============================================================================

-- Very permissive policy for collection_pickups - allows all authenticated users
CREATE POLICY "allow_all_authenticated_collection_pickups" ON public.collection_pickups
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Very permissive policy for pickup_items - allows all authenticated users
CREATE POLICY "allow_all_authenticated_pickup_items" ON public.pickup_items
  FOR ALL 
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- STEP 3: ENSURE RLS IS ENABLED
-- ============================================================================

-- Enable RLS on both tables
ALTER TABLE public.collection_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 4: GRANT ALL NECESSARY PERMISSIONS
-- ============================================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;

-- Grant all permissions on collection_pickups table
GRANT ALL ON public.collection_pickups TO authenticated;

-- Grant all permissions on pickup_items table
GRANT ALL ON public.pickup_items TO authenticated;

-- Grant permissions on materials table
GRANT ALL ON public.materials TO authenticated;

-- Grant permissions on users table
GRANT ALL ON public.users TO authenticated;

-- Grant permissions on user_profiles table (if it exists)
GRANT ALL ON public.user_profiles TO authenticated;

-- ============================================================================
-- STEP 5: VERIFY POLICIES
-- ============================================================================

-- Check that policies were created
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

SELECT 'Very permissive RLS policies created for testing!' as status;
