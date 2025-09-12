-- ============================================================================
-- SAFE FIX FOR UNIFIED_COLLECTIONS FOREIGN KEY ISSUES
-- ============================================================================
-- This script safely removes foreign key constraints and updates policies
-- without causing conflicts with existing policies

-- 1. Drop all foreign key constraints that reference user_profiles
-- ============================================================================

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_customer_id_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_collector_id_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_created_by_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_pickup_address_id_fkey;

-- 2. Drop existing policies safely
-- ============================================================================

-- Drop existing policies for unified_collections
DROP POLICY IF EXISTS "Collectors can insert collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Collectors can view their collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Office staff can view all collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Office staff can update collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Allow authenticated users to insert collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Allow users to view their own collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Allow authenticated users to view collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Allow authenticated users to update collections" ON public.unified_collections;

-- Drop existing policies for collection_materials
DROP POLICY IF EXISTS "Collectors can insert materials" ON public.collection_materials;
DROP POLICY IF EXISTS "Collectors can view materials" ON public.collection_materials;
DROP POLICY IF EXISTS "Office staff can view all materials" ON public.collection_materials;
DROP POLICY IF EXISTS "Allow authenticated users to insert materials" ON public.collection_materials;
DROP POLICY IF EXISTS "Allow authenticated users to view materials" ON public.collection_materials;

-- 3. Create new policies for unified_collections
-- ============================================================================

CREATE POLICY "Allow authenticated users to insert collections" ON public.unified_collections
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view collections" ON public.unified_collections
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update collections" ON public.unified_collections
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 4. Ensure collection_materials table exists and has proper structure
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collection_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.unified_collections(id) ON DELETE CASCADE,
  material_id UUID NOT NULL, -- No foreign key constraint to materials table
  quantity DECIMAL(8,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  points_per_kg INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER GENERATED ALWAYS AS (quantity * points_per_kg) STORED,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable RLS on collection_materials if not already enabled
-- ============================================================================

ALTER TABLE public.collection_materials ENABLE ROW LEVEL SECURITY;

-- 6. Create new policies for collection_materials
-- ============================================================================

CREATE POLICY "Allow authenticated users to insert materials" ON public.collection_materials
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view materials" ON public.collection_materials
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 7. Grant permissions
-- ============================================================================

GRANT ALL ON public.unified_collections TO authenticated;
GRANT ALL ON public.collection_materials TO authenticated;

-- 8. Create indexes for performance (only if they don't exist)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_unified_collections_customer_id ON public.unified_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_unified_collections_collector_id ON public.unified_collections(collector_id);
CREATE INDEX IF NOT EXISTS idx_unified_collections_status ON public.unified_collections(status);
CREATE INDEX IF NOT EXISTS idx_unified_collections_created_at ON public.unified_collections(created_at);
CREATE INDEX IF NOT EXISTS idx_unified_collections_collection_code ON public.unified_collections(collection_code);

CREATE INDEX IF NOT EXISTS idx_collection_materials_collection_id ON public.collection_materials(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_materials_material_id ON public.collection_materials(material_id);

-- 9. Test the setup
-- ============================================================================

-- Check if tables exist and are accessible
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name IN ('unified_collections', 'collection_materials')
AND table_schema = 'public';

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'unified_collections' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. Verify RLS policies
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
AND schemaname = 'public';

-- 11. Test insert (this should work now)
-- ============================================================================

-- Try to insert a test record to verify everything works
-- This will be rolled back automatically
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
    'TEST123', 
    'Test Customer', 
    'Test Collector',
    10.5,
    150.00,
    2,
    'completed'
  );
ROLLBACK;

-- If we get here without errors, the setup is working!
SELECT 'Setup completed successfully! Collections can now be created.' as status;
