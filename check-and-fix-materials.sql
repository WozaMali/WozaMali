-- Check and fix materials table structure
-- Run this in your Supabase SQL Editor to fix the materials table issue

-- 1. First, let's see what the materials table actually looks like
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'materials'
ORDER BY ordinal_position;

-- 2. Check if the table has any data
SELECT COUNT(*) as existing_records FROM public.materials;

-- 3. If the table has the wrong structure, let's drop and recreate it
-- (Only run this if you're sure you want to recreate the table)
DROP TABLE IF EXISTS public.materials CASCADE;

-- 4. Create the materials table with the correct structure
CREATE TABLE public.materials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  rate_per_kg DECIMAL(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Insert sample materials
INSERT INTO public.materials (name, description, rate_per_kg) VALUES
  ('Paper', 'Recyclable paper products', 1.50),
  ('Cardboard', 'Cardboard boxes and packaging', 1.20),
  ('Plastic', 'Plastic bottles and containers', 2.00),
  ('Glass', 'Glass bottles and jars', 1.80),
  ('Metal', 'Aluminum cans and scrap metal', 3.50),
  ('Electronics', 'Electronic waste and components', 5.00);

-- 6. Verify the table was created correctly
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'materials'
ORDER BY ordinal_position;

-- 7. Check the data
SELECT * FROM public.materials;
