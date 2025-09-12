-- ============================================================================
-- TEMPORARILY DISABLE RLS FOR TESTING
-- ============================================================================
-- This script temporarily disables RLS to test if the basic functionality works

-- 1. Disable RLS on both tables
-- ============================================================================

ALTER TABLE public.unified_collections DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_materials DISABLE ROW LEVEL SECURITY;

-- 2. Remove foreign key constraints
-- ============================================================================

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_customer_id_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_collector_id_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_created_by_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_pickup_address_id_fkey;

-- 3. Grant all permissions
-- ============================================================================

GRANT ALL ON public.unified_collections TO authenticated;
GRANT ALL ON public.collection_materials TO authenticated;

-- 4. Test insert
-- ============================================================================

BEGIN;
  INSERT INTO public.unified_collections (
    collection_code, 
    customer_name, 
    collector_name,
    total_weight_kg,
    total_value,
    material_count,
    status
  ) VALUES (
    'TEST' || EXTRACT(EPOCH FROM NOW())::BIGINT, 
    'Test Customer', 
    'Test Collector',
    10.5,
    150.00,
    2,
    'completed'
  );
ROLLBACK;

SELECT 'RLS disabled temporarily - test the Collector App now!' as status;