-- ============================================================================
-- FIX UNIFIED_COLLECTIONS FOREIGN KEY CONSTRAINTS
-- ============================================================================
-- This script fixes the foreign key constraint issues by making them optional
-- and ensuring user profiles exist for authenticated users

-- 1. First, let's check what user tables exist
-- ============================================================================

-- Check if user_profiles table exists and has data
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name IN ('user_profiles', 'users', 'profiles')
AND table_schema = 'public';

-- 2. Create user_profiles table if it doesn't exist
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL, -- Links to Supabase auth.users
  full_name TEXT,
  phone TEXT,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'resident' CHECK (role IN ('resident', 'collector', 'office', 'admin')),
  address TEXT,
  area_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create a function to ensure user profiles exist
-- ============================================================================

CREATE OR REPLACE FUNCTION ensure_user_profile(p_user_id UUID, p_email TEXT DEFAULT NULL, p_full_name TEXT DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_profile_id UUID;
BEGIN
  -- Check if profile already exists
  SELECT id INTO v_profile_id
  FROM public.user_profiles
  WHERE user_id = p_user_id;
  
  -- If not exists, create one
  IF v_profile_id IS NULL THEN
    INSERT INTO public.user_profiles (user_id, email, full_name, role)
    VALUES (p_user_id, p_email, p_full_name, 'resident')
    RETURNING id INTO v_profile_id;
  END IF;
  
  RETURN v_profile_id;
END;
$$;

-- 4. Update the unified_collections table to handle missing user profiles
-- ============================================================================

-- Drop existing foreign key constraints
ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_customer_id_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_collector_id_fkey;

ALTER TABLE public.unified_collections 
DROP CONSTRAINT IF EXISTS unified_collections_created_by_fkey;

-- Add new foreign key constraints that are more flexible
ALTER TABLE public.unified_collections 
ADD CONSTRAINT unified_collections_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.unified_collections 
ADD CONSTRAINT unified_collections_collector_id_fkey 
FOREIGN KEY (collector_id) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.unified_collections 
ADD CONSTRAINT unified_collections_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.user_profiles(id) ON DELETE SET NULL;

-- 5. Create a trigger to automatically create user profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION create_user_profile_on_collection()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_customer_profile_id UUID;
  v_collector_profile_id UUID;
  v_created_by_profile_id UUID;
BEGIN
  -- Ensure customer profile exists
  IF NEW.customer_id IS NOT NULL THEN
    v_customer_profile_id := ensure_user_profile(NEW.customer_id, NEW.customer_email, NEW.customer_name);
    NEW.customer_id := v_customer_profile_id;
  END IF;
  
  -- Ensure collector profile exists
  IF NEW.collector_id IS NOT NULL THEN
    v_collector_profile_id := ensure_user_profile(NEW.collector_id, NEW.collector_phone, NEW.collector_name);
    NEW.collector_id := v_collector_profile_id;
  END IF;
  
  -- Ensure created_by profile exists
  IF NEW.created_by IS NOT NULL THEN
    v_created_by_profile_id := ensure_user_profile(NEW.created_by, NULL, NULL);
    NEW.created_by := v_created_by_profile_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_create_user_profiles
  BEFORE INSERT ON public.unified_collections
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile_on_collection();

-- 6. Update RLS policies to work with the new structure
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Collectors can insert collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Collectors can view their collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Office staff can view all collections" ON public.unified_collections;
DROP POLICY IF EXISTS "Office staff can update collections" ON public.unified_collections;

-- Create new policies
CREATE POLICY "Allow authenticated users to insert collections" ON public.unified_collections
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow users to view their own collections" ON public.unified_collections
  FOR SELECT USING (
    auth.uid() = customer_id OR 
    auth.uid() = collector_id OR
    auth.uid() = created_by
  );

CREATE POLICY "Allow office staff to view all collections" ON public.unified_collections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('office', 'admin')
    )
  );

CREATE POLICY "Allow office staff to update collections" ON public.unified_collections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('office', 'admin')
    )
  );

-- 7. Grant necessary permissions
-- ============================================================================

GRANT ALL ON public.user_profiles TO authenticated;
GRANT ALL ON public.unified_collections TO authenticated;

-- 8. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);

-- 9. Test the setup
-- ============================================================================

-- Check if tables exist
SELECT 
  table_name, 
  table_type 
FROM information_schema.tables 
WHERE table_name IN ('unified_collections', 'user_profiles', 'collection_materials')
AND table_schema = 'public';

-- Check foreign key constraints
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'unified_collections'
AND tc.table_schema = 'public';
