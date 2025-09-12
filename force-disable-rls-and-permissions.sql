-- Force disable RLS and grant all permissions
-- This should definitely work

-- ============================================================================
-- STEP 1: COMPLETELY DISABLE RLS
-- ============================================================================

-- Disable RLS on collection_pickups table
ALTER TABLE public.collection_pickups DISABLE ROW LEVEL SECURITY;

-- Disable RLS on pickup_items table  
ALTER TABLE public.pickup_items DISABLE ROW LEVEL SECURITY;

-- Disable RLS on materials table
ALTER TABLE public.materials DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: DROP ALL EXISTING POLICIES
-- ============================================================================

-- Drop all policies on collection_pickups
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'collection_pickups') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.collection_pickups';
    END LOOP;
END $$;

-- Drop all policies on pickup_items
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'pickup_items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.pickup_items';
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: GRANT ALL PERMISSIONS TO AUTHENTICATED USERS
-- ============================================================================

-- Grant all permissions on collection_pickups
GRANT ALL PRIVILEGES ON public.collection_pickups TO authenticated;
GRANT ALL PRIVILEGES ON public.collection_pickups TO anon;

-- Grant all permissions on pickup_items
GRANT ALL PRIVILEGES ON public.pickup_items TO authenticated;
GRANT ALL PRIVILEGES ON public.pickup_items TO anon;

-- Grant all permissions on materials
GRANT ALL PRIVILEGES ON public.materials TO authenticated;
GRANT ALL PRIVILEGES ON public.materials TO anon;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- ============================================================================
-- STEP 4: VERIFY RLS IS DISABLED
-- ============================================================================

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('collection_pickups', 'pickup_items', 'materials');

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 'RLS completely disabled and all permissions granted!' as status;
