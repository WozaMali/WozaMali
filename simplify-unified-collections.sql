-- ============================================================================
-- SIMPLIFY UNIFIED_COLLECTIONS TO WORK WITHOUT USER_PROFILES
-- ============================================================================
-- This script makes the foreign key constraints optional so collections can be created
-- without requiring user profiles to exist first

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

-- 2. Make the UUID columns accept any UUID (no foreign key constraints)
-- ============================================================================

-- The columns are already UUID type, so we just need to ensure they can accept any UUID
-- No changes needed to column types

-- 3. Update RLS policies to be more permissive
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Collectors can insert collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Collectors can view their collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Office staff can view all collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Office staff can update collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Allow authenticated users to insert collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Allow users to view their own collections" ON public.unified_collections;

-- Create simple, permissive policies
CREATE POLICY "Allow authenticated users to insert collections" ON public.unified_collections
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view collections" ON public.unified_collections
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update collections" ON public.unified_collections
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 4. Update collection_materials table constraints
-- ============================================================================

-- Check if collection_materials table exists
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name = 'collection_materials'
AND table_schema = 'public';

-- If collection_materials doesn't exist, create it
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

-- 5. Create RLS policies for collection_materials
-- ============================================================================

ALTER TABLE public.collection_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to insert materials" ON public.collection_materials
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view materials" ON public.collection_materials
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 6. Grant permissions
-- ============================================================================

GRANT ALL ON public.unified_collections TO authenticated;
GRANT ALL ON public.collection_materials TO authenticated;

-- 7. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_unified_collections_customer_id ON public.unified_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_unified_collections_collector_id ON public.unified_collections(collector_id);
CREATE INDEX IF NOT EXISTS idx_unified_collections_status ON public.unified_collections(status);
CREATE INDEX IF NOT EXISTS idx_unified_collections_created_at ON public.unified_collections(created_at);

CREATE INDEX IF NOT EXISTS idx_collection_materials_collection_id ON public.collection_materials(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_materials_material_id ON public.collection_materials(material_id);

-- 8. Test the setup
-- ============================================================================

-- Check table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable 
FROM information_schema.columns 
WHERE table_name = 'unified_collections' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if we can insert a test record (this will fail but show us the error)
-- INSERT INTO public.unified_collections (collection_code, customer_name, collector_name) 
-- VALUES ('TEST123', 'Test Customer', 'Test Collector');
