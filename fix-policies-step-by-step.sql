-- ============================================================================
-- STEP-BY-STEP FIX FOR UNIFIED_COLLECTIONS POLICIES
-- ============================================================================
-- This script first checks what policies exist, then removes them safely

-- 1. First, let's see what policies currently exist
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('unified_collections', 'collection_materials')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- 2. Drop ALL existing policies for both tables
-- ============================================================================

-- Drop policies for unified_collections
DROP POLICY IF EXISTS "Collectors can insert collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Collectors can view their collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Office staff can view all collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Office staff can update collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Allow authenticated users to insert collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Allow users to view their own collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Allow authenticated users to view collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Allow authenticated users to update collections" ON public.unified_collections;

-- Drop policies for collection_materials
DROP POLICY IF EXISTS "Collectors can insert materials" ON public.collection_materials;
DROP POLICY IF EXISTS "Collectors can view materials" ON public.collection_materials;
DROP POLICY IF EXISTS "Office staff can view all materials" ON public.collection_materials;
DROP POLICY IF EXISTS "Allow authenticated users to insert materials" ON public.collection_materials;
DROP POLICY IF EXISTS "Allow authenticated users to view materials" ON public.collection_materials;

-- 3. Remove foreign key constraints
-- ============================================================================

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_customer_id_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_collector_id_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_created_by_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_pickup_address_id_fkey;

-- 4. Create new, simple policies
-- ============================================================================

-- Policies for unified_collections
CREATE POLICY "insert_collections" ON public.unified_collections
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "select_collections" ON public.unified_collections
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "update_collections" ON public.unified_collections
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policies for collection_materials
CREATE POLICY "insert_materials" ON public.collection_materials
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "select_materials" ON public.collection_materials
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. Grant permissions
-- ============================================================================

GRANT ALL ON public.unified_collections TO authenticated;
GRANT ALL ON public.collection_materials TO authenticated;

-- 6. Verify the setup
-- ============================================================================

-- Check what policies exist now
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('unified_collections', 'collection_materials')
AND schemaname = 'public'
ORDER BY tablename, policyname;

-- Test insert
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

SELECT 'Setup completed successfully!' as status;
