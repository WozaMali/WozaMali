-- ============================================================================
-- CREATE UNIFIED COLLECTIONS SCHEMA
-- ============================================================================
-- This script creates the unified_collections and collection_materials tables
-- Run this in your Supabase SQL Editor

-- 1. Create unified_collections table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.unified_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_code TEXT UNIQUE NOT NULL,
  collection_type TEXT DEFAULT 'pickup' CHECK (collection_type IN ('pickup', 'dropoff', 'scheduled', 'emergency')),
  customer_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  customer_email TEXT,
  pickup_address_id UUID REFERENCES public.user_addresses(id) ON DELETE SET NULL,
  pickup_address TEXT,
  pickup_coordinates TEXT,
  collector_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  collector_name TEXT,
  collector_phone TEXT,
  total_weight_kg DECIMAL(10,2) DEFAULT 0,
  total_value DECIMAL(12,2) DEFAULT 0,
  material_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'approved', 'rejected', 'cancelled', 'no_show')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_date DATE,
  scheduled_time TIME,
  actual_date DATE,
  actual_time TIME,
  completed_at TIMESTAMP WITH TIME ZONE,
  customer_notes TEXT,
  collector_notes TEXT,
  admin_notes TEXT,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  created_by UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create collection_materials table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.collection_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.unified_collections(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  quantity DECIMAL(8,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  points_per_kg INTEGER NOT NULL DEFAULT 0,
  points_earned INTEGER GENERATED ALWAYS AS (quantity * points_per_kg) STORED,
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_unified_collections_customer_id ON public.unified_collections(customer_id);
CREATE INDEX IF NOT EXISTS idx_unified_collections_collector_id ON public.unified_collections(collector_id);
CREATE INDEX IF NOT EXISTS idx_unified_collections_status ON public.unified_collections(status);
CREATE INDEX IF NOT EXISTS idx_unified_collections_created_at ON public.unified_collections(created_at);
CREATE INDEX IF NOT EXISTS idx_unified_collections_collection_code ON public.unified_collections(collection_code);

CREATE INDEX IF NOT EXISTS idx_collection_materials_collection_id ON public.collection_materials(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_materials_material_id ON public.collection_materials(material_id);

-- 4. Enable RLS (Row Level Security)
-- ============================================================================

ALTER TABLE public.unified_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_materials ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for unified_collections
-- ============================================================================

-- Allow collectors to insert collections
CREATE POLICY "Collectors can insert collections" ON public.unified_collections
  FOR INSERT WITH CHECK (
    auth.uid() = collector_id OR 
    auth.uid() = created_by
  );

-- Allow collectors to view their own collections
CREATE POLICY "Collectors can view their collections" ON public.unified_collections
  FOR SELECT USING (
    auth.uid() = collector_id OR 
    auth.uid() = customer_id OR
    auth.uid() = created_by
  );

-- Allow office staff to view all collections
CREATE POLICY "Office staff can view all collections" ON public.unified_collections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role = 'office'
    )
  );

-- Allow office staff to update collections (for approval/rejection)
CREATE POLICY "Office staff can update collections" ON public.unified_collections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role = 'office'
    )
  );

-- 6. Create RLS policies for collection_materials
-- ============================================================================

-- Allow collectors to insert materials
CREATE POLICY "Collectors can insert materials" ON public.collection_materials
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.unified_collections 
      WHERE id = collection_id 
      AND (auth.uid() = collector_id OR auth.uid() = created_by)
    )
  );

-- Allow collectors to view materials for their collections
CREATE POLICY "Collectors can view materials" ON public.collection_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.unified_collections 
      WHERE id = collection_id 
      AND (auth.uid() = collector_id OR auth.uid() = customer_id OR auth.uid() = created_by)
    )
  );

-- Allow office staff to view all materials
CREATE POLICY "Office staff can view all materials" ON public.collection_materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND role = 'office'
    )
  );

-- 7. Grant necessary permissions
-- ============================================================================

GRANT ALL ON public.unified_collections TO authenticated;
GRANT ALL ON public.collection_materials TO authenticated;

-- 8. Create a function to generate collection codes
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_collection_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN 'PK' || EXTRACT(EPOCH FROM NOW())::BIGINT;
END;
$$;

-- 9. Add a trigger to auto-generate collection codes
-- ============================================================================

CREATE OR REPLACE FUNCTION set_collection_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.collection_code IS NULL OR NEW.collection_code = '' THEN
    NEW.collection_code := generate_collection_code();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_collection_code
  BEFORE INSERT ON public.unified_collections
  FOR EACH ROW
  EXECUTE FUNCTION set_collection_code();

-- 10. Add updated_at trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_unified_collections_updated_at
  BEFORE UPDATE ON public.unified_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if tables were created successfully
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
