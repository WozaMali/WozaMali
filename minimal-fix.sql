-- ============================================================================
-- MINIMAL FIX FOR UNIFIED_COLLECTIONS
-- ============================================================================
-- This script only removes the problematic foreign key constraints

-- 1. Drop foreign key constraints that are causing issues
-- ============================================================================

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_customer_id_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_collector_id_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_created_by_fkey;

-- 2. Ensure collection_materials table exists
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collection_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.unified_collections(id) ON DELETE CASCADE,
  material_id UUID NOT NULL,
  quantity DECIMAL(8,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  points_per_kg INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER GENERATED ALWAYS AS (quantity * points_per_kg) STORED,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS and create basic policies
-- ============================================================================

ALTER TABLE public.collection_materials ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Allow authenticated users to insert materials" ON public.collection_materials;
DROP POLICY IF EXISTS "Allow authenticated users to view materials" ON public.collection_materials;

-- Create new policies
CREATE POLICY "Allow authenticated users to insert materials" ON public.collection_materials
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view materials" ON public.collection_materials
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 4. Grant permissions
-- ============================================================================

GRANT ALL ON public.unified_collections TO authenticated;
GRANT ALL ON public.collection_materials TO authenticated;

-- 5. Test
-- ============================================================================

SELECT 'Foreign key constraints removed successfully!' as status;
