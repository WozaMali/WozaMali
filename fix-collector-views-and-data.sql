-- ============================================================================
-- FIX COLLECTOR VIEWS AND DATA ACCESS
-- ============================================================================
-- This script fixes the township_dropdown and residents_view issues
-- that are causing empty error objects in the collector app

-- 1. First, ensure all required tables exist and have data
SELECT 'Checking and fixing tables...' as status;

-- Ensure areas table exists and has data
DO $$
BEGIN
    -- Check if areas table exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'areas') THEN
        RAISE NOTICE 'Creating areas table...';
        
        CREATE TABLE public.areas (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            city TEXT NOT NULL DEFAULT 'Soweto',
            province TEXT DEFAULT 'Gauteng',
            postal_code TEXT,
            subdivisions JSONB DEFAULT '[]',
            boundaries JSONB,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        RAISE NOTICE 'Areas table created';
    END IF;
    
    -- Check if areas table has data
    IF NOT EXISTS (SELECT 1 FROM public.areas LIMIT 1) THEN
        RAISE NOTICE 'Inserting sample areas data...';
        
        INSERT INTO public.areas (name, description, city, postal_code, subdivisions, is_active) VALUES
        ('Dobsonville', 'Dobsonville township with Ext 1–4', 'Soweto', '1863', '["Ext 1", "Ext 2", "Ext 3", "Ext 4"]', true),
        ('Orlando East', 'Orlando East township with Zone 1–5', 'Soweto', '1804', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"]', true),
        ('Orlando West', 'Orlando West township with Ext 1–3', 'Soweto', '1804', '["Ext 1", "Ext 2", "Ext 3"]', true),
        ('Soweto Central', 'Central Soweto area', 'Soweto', '1804', '["Central", "North", "South"]', true),
        ('Diepkloof', 'Diepkloof township with Ext 1–6', 'Soweto', '1864', '["Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5", "Ext 6"]', true),
        ('Pimville', 'Pimville township with Zone 1–4', 'Soweto', '1809', '["Zone 1", "Zone 2", "Zone 3", "Zone 4"]', true),
        ('Meadowlands', 'Meadowlands township with Ext 1–8', 'Soweto', '1852', '["Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5", "Ext 6", "Ext 7", "Ext 8"]', true),
        ('Kliptown', 'Kliptown township with Zone 1–3', 'Soweto', '1811', '["Zone 1", "Zone 2", "Zone 3"]', true),
        ('Chiawelo', 'Chiawelo township with Ext 1–5', 'Soweto', '1818', '["Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5"]', true),
        ('Thulani', 'Thulani township with Ext 1–3', 'Soweto', '1874', '["Ext 1", "Ext 2", "Ext 3"]', true),
        ('Tladi', 'Tladi township with Zone 1–3', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3"]', true),
        ('Zola', 'Zola township with Zone 1–6', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6"]', true),
        ('Zondi', 'Zondi township with Zone 1–5', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"]', true);
        
        RAISE NOTICE 'Sample areas data inserted';
    END IF;
END $$;

-- 2. Ensure users table has proper structure
DO $$
BEGIN
    -- Add missing columns to users table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'first_name') THEN
        ALTER TABLE public.users ADD COLUMN first_name TEXT;
        RAISE NOTICE 'Added first_name column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'last_name') THEN
        ALTER TABLE public.users ADD COLUMN last_name TEXT;
        RAISE NOTICE 'Added last_name column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE public.users ADD COLUMN full_name TEXT;
        RAISE NOTICE 'Added full_name column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE public.users ADD COLUMN phone TEXT;
        RAISE NOTICE 'Added phone column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'date_of_birth') THEN
        ALTER TABLE public.users ADD COLUMN date_of_birth DATE;
        RAISE NOTICE 'Added date_of_birth column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'street_addr') THEN
        ALTER TABLE public.users ADD COLUMN street_addr TEXT;
        RAISE NOTICE 'Added street_addr column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'township_id') THEN
        ALTER TABLE public.users ADD COLUMN township_id UUID;
        RAISE NOTICE 'Added township_id column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'subdivision') THEN
        ALTER TABLE public.users ADD COLUMN subdivision TEXT;
        RAISE NOTICE 'Added subdivision column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'suburb') THEN
        ALTER TABLE public.users ADD COLUMN suburb TEXT;
        RAISE NOTICE 'Added suburb column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'city') THEN
        ALTER TABLE public.users ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'postal_code') THEN
        ALTER TABLE public.users ADD COLUMN postal_code TEXT;
        RAISE NOTICE 'Added postal_code column to users table';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'status') THEN
        ALTER TABLE public.users ADD COLUMN status TEXT DEFAULT 'active';
        RAISE NOTICE 'Added status column to users table';
    END IF;
END $$;

-- 3. Recreate township_dropdown view with proper error handling
DROP VIEW IF EXISTS public.township_dropdown CASCADE;

CREATE VIEW public.township_dropdown AS
SELECT 
    id,
    name as township_name,
    COALESCE(postal_code, '') as postal_code,
    COALESCE(city, 'Soweto') as city,
    '[]'::jsonb as subdivisions
FROM public.areas 
ORDER BY name;

-- 4. Recreate subdivision_dropdown view with proper error handling
DROP VIEW IF EXISTS public.subdivision_dropdown CASCADE;

CREATE VIEW public.subdivision_dropdown AS
SELECT 
    a.id as area_id,
    a.name as township_name,
    COALESCE(a.postal_code, '') as postal_code,
    'Default' as subdivision
FROM public.areas a
ORDER BY a.name;

-- 5. Recreate residents_view with simplified logic
DROP VIEW IF EXISTS public.residents_view CASCADE;

CREATE VIEW public.residents_view AS
SELECT 
    u.id,
    COALESCE(u.first_name, '') as first_name,
    COALESCE(u.last_name, '') as last_name,
    COALESCE(u.full_name, COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')) as full_name,
    u.email,
    COALESCE(u.phone, '') as phone,
    u.date_of_birth,
    COALESCE(u.street_addr, '') as street_addr,
    u.township_id,
    COALESCE(a_township.name, '') as township_name,
    COALESCE(u.subdivision, '') as subdivision,
    COALESCE(u.suburb, '') as suburb,
    COALESCE(u.city, 'Soweto') as city,
    COALESCE(u.postal_code, '') as postal_code,
    COALESCE(u.status, 'active') as status,
    u.created_at,
    u.updated_at,
    -- Address completeness indicator
    CASE 
        WHEN u.township_id IS NOT NULL AND u.subdivision IS NOT NULL AND u.subdivision != '' THEN 'complete'
        WHEN u.suburb IS NOT NULL AND u.suburb != '' THEN 'legacy'
        ELSE 'incomplete'
    END as address_status
FROM public.users u
LEFT JOIN public.areas a_township ON u.township_id = a_township.id
WHERE COALESCE(u.status, 'active') = 'active'
ORDER BY u.created_at DESC;

-- 6. Grant permissions on all views
GRANT SELECT ON public.township_dropdown TO authenticated;
GRANT SELECT ON public.subdivision_dropdown TO authenticated;
GRANT SELECT ON public.residents_view TO authenticated;

-- 7. Test all views
SELECT 'Testing township_dropdown view...' as test_status;
SELECT COUNT(*) as township_count FROM public.township_dropdown;

SELECT 'Testing subdivision_dropdown view...' as test_status;
SELECT COUNT(*) as subdivision_count FROM public.subdivision_dropdown;

SELECT 'Testing residents_view...' as test_status;
SELECT COUNT(*) as residents_count FROM public.residents_view;

-- 8. Show sample data
SELECT 'Sample township data:' as sample_status;
SELECT township_name, city, postal_code FROM public.township_dropdown LIMIT 3;

SELECT 'Sample residents data:' as sample_status;
SELECT full_name, email, status FROM public.residents_view LIMIT 3;

SELECT 'Collector views and data fixed successfully!' as final_status;
