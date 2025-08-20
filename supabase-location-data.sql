-- WozaMoney Location Data Setup Script (Simplified Version)
-- This script creates and populates the location tables needed for the sign-up form

-- 1. Drop existing functions first to avoid parameter conflicts
DROP FUNCTION IF EXISTS public.get_townships_by_city(TEXT);
DROP FUNCTION IF EXISTS public.get_cities_by_province(TEXT);

-- 2. Create location tables if they don't exist
DO $$
BEGIN
    -- Create townships table
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'townships') THEN
        CREATE TABLE public.townships (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            postal_code TEXT NOT NULL,
            city TEXT NOT NULL DEFAULT 'Soweto',
            province TEXT NOT NULL DEFAULT 'Gauteng',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created townships table';
    ELSE
        RAISE NOTICE 'townships table already exists';
    END IF;

    -- Create cities table
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cities') THEN
        CREATE TABLE public.cities (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            province TEXT NOT NULL DEFAULT 'Gauteng',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created cities table';
    ELSE
        RAISE NOTICE 'cities table already exists';
    END IF;
END $$;

-- 3. Clear existing data and reinsert (to avoid conflicts)
TRUNCATE TABLE public.townships CASCADE;
TRUNCATE TABLE public.cities CASCADE;

-- 4. Insert Soweto townships with postal codes
INSERT INTO public.townships (name, postal_code, city, province) VALUES
    ('Baragwanath', '1862', 'Soweto', 'Gauteng'),
    ('Chiawelo', '1818', 'Soweto', 'Gauteng'),
    ('Dlamini', '1804', 'Soweto', 'Gauteng'),
    ('Dobsonville', '1804', 'Soweto', 'Gauteng'),
    ('Emdeni', '1804', 'Soweto', 'Gauteng'),
    ('Jabavu', '1804', 'Soweto', 'Gauteng'),
    ('Kliptown', '1804', 'Soweto', 'Gauteng'),
    ('Klipspruit', '1804', 'Soweto', 'Gauteng'),
    ('Meadowlands', '1804', 'Soweto', 'Gauteng'),
    ('Mofolo', '1804', 'Soweto', 'Gauteng'),
    ('Moroka', '1804', 'Soweto', 'Gauteng'),
    ('Naledi', '1804', 'Soweto', 'Gauteng'),
    ('Orlando', '1804', 'Soweto', 'Gauteng'),
    ('Pimville', '1804', 'Soweto', 'Gauteng'),
    ('Protea Glen', '1804', 'Soweto', 'Gauteng'),
    ('Protea North', '1804', 'Soweto', 'Gauteng'),
    ('Protea South', '1804', 'Soweto', 'Gauteng'),
    ('Senaoane', '1804', 'Soweto', 'Gauteng'),
    ('Zola', '1804', 'Soweto', 'Gauteng'),
    ('Zondi', '1866', 'Soweto', 'Gauteng');

-- 5. Insert Gauteng cities (Soweto first)
INSERT INTO public.cities (name, province) VALUES
    ('Soweto', 'Gauteng'),
    ('Johannesburg', 'Gauteng'),
    ('Pretoria', 'Gauteng'),
    ('Centurion', 'Gauteng'),
    ('Sandton', 'Gauteng'),
    ('Randburg', 'Gauteng'),
    ('Roodepoort', 'Gauteng'),
    ('Krugersdorp', 'Gauteng'),
    ('Boksburg', 'Gauteng'),
    ('Benoni', 'Gauteng'),
    ('Springs', 'Gauteng'),
    ('Brakpan', 'Gauteng'),
    ('Kempton Park', 'Gauteng'),
    ('Tembisa', 'Gauteng'),
    ('Midrand', 'Gauteng'),
    ('Fourways', 'Gauteng'),
    ('Northcliff', 'Gauteng'),
    ('Melville', 'Gauteng'),
    ('Rosebank', 'Gauteng'),
    ('Parktown', 'Gauteng');

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_townships_city ON public.townships(city);
CREATE INDEX IF NOT EXISTS idx_townships_postal_code ON public.townships(postal_code);
CREATE INDEX IF NOT EXISTS idx_cities_province ON public.cities(province);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.townships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

-- 8. Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow read access to townships" ON public.townships;
DROP POLICY IF EXISTS "Allow read access to cities" ON public.cities;

-- 9. Create RLS policies allowing all authenticated users to read data
CREATE POLICY "Allow read access to townships" ON public.townships
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to cities" ON public.cities
    FOR SELECT USING (true);

-- 10. Create PostgreSQL functions for efficient data retrieval
CREATE OR REPLACE FUNCTION public.get_townships_by_city(city_name TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    postal_code TEXT,
    city TEXT,
    province TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT t.id, t.name, t.postal_code, t.city, t.province
    FROM public.townships t
    WHERE t.city ILIKE city_name AND t.is_active = TRUE
    ORDER BY t.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_cities_by_province(province_name TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    province TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.province
    FROM public.cities c
    WHERE c.province ILIKE province_name AND c.is_active = TRUE
    ORDER BY 
        CASE WHEN c.name = 'Soweto' THEN 0 ELSE 1 END,
        c.name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Verify the data was inserted correctly
SELECT 'Townships' as table_name, COUNT(*) as count FROM public.townships
UNION ALL
SELECT 'Cities' as table_name, COUNT(*) as count FROM public.cities;

-- 12. Show sample data
SELECT 'Sample Townships' as info, name, postal_code FROM public.townships LIMIT 5;
SELECT 'Sample Cities' as info, name FROM public.cities LIMIT 5;
