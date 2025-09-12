-- ============================================================================
-- COMPREHENSIVE FIX FOR MISSING VIEWS AND ROLES - CORRECTED VERSION
-- ============================================================================
-- This script fixes the missing township_dropdown view and persistent role issues

-- 1. First, check what tables actually exist
SELECT 'Checking existing tables...' as status;

-- Check if areas table exists and what columns it has
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'areas') THEN
        RAISE NOTICE 'areas table does not exist. Creating it...';
        
        -- Create areas table with proper structure
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
        
        -- Insert some sample Soweto townships
        INSERT INTO public.areas (name, description, city, postal_code, subdivisions) VALUES
        ('Dobsonville', 'Dobsonville township with Ext 1–4', 'Soweto', '1863', '["Ext 1", "Ext 2", "Ext 3", "Ext 4"]'),
        ('Orlando East', 'Orlando East township with Zone 1–5', 'Soweto', '1804', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"]'),
        ('Orlando West', 'Orlando West township with Ext 1–3', 'Soweto', '1804', '["Ext 1", "Ext 2", "Ext 3"]'),
        ('Soweto Central', 'Central Soweto area', 'Soweto', '1804', '["Central", "North", "South"]'),
        ('Diepkloof', 'Diepkloof township with Ext 1–6', 'Soweto', '1864', '["Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5", "Ext 6"]'),
        ('Pimville', 'Pimville township with Zone 1–4', 'Soweto', '1809', '["Zone 1", "Zone 2", "Zone 3", "Zone 4"]'),
        ('Meadowlands', 'Meadowlands township with Ext 1–8', 'Soweto', '1852', '["Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5", "Ext 6", "Ext 7", "Ext 8"]'),
        ('Kliptown', 'Kliptown township with Zone 1–3', 'Soweto', '1811', '["Zone 1", "Zone 2", "Zone 3"]'),
        ('Chiawelo', 'Chiawelo township with Ext 1–5', 'Soweto', '1818', '["Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5"]'),
        ('Thulani', 'Thulani township with Ext 1–3', 'Soweto', '1874', '["Ext 1", "Ext 2", "Ext 3"]'),
        ('Tladi', 'Tladi township with Zone 1–3', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3"]'),
        ('Zola', 'Zola township with Zone 1–6', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6"]'),
        ('Zondi', 'Zondi township with Zone 1–5', 'Soweto', '1818', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5"]');
        
        RAISE NOTICE 'areas table created with sample data';
    ELSE
        RAISE NOTICE 'areas table already exists';
    END IF;
END $$;

-- 2. Check if subdivisions column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'areas' 
        AND column_name = 'subdivisions'
    ) THEN
        RAISE NOTICE 'Adding subdivisions column to areas table...';
        ALTER TABLE public.areas ADD COLUMN subdivisions JSONB DEFAULT '[]';
        RAISE NOTICE 'subdivisions column added';
    ELSE
        RAISE NOTICE 'subdivisions column already exists';
    END IF;
END $$;

-- 3. Create township_dropdown view (this is what's causing the 404 error)
DROP VIEW IF EXISTS public.township_dropdown CASCADE;

CREATE VIEW public.township_dropdown AS
SELECT 
    id,
    name as township_name,
    postal_code,
    city,
    COALESCE(subdivisions, '[]'::jsonb) as subdivisions
FROM public.areas 
WHERE is_active = TRUE 
ORDER BY name;

-- 4. Create subdivision_dropdown view
DROP VIEW IF EXISTS public.subdivision_dropdown CASCADE;

CREATE VIEW public.subdivision_dropdown AS
SELECT 
    a.id as area_id,
    a.name as township_name,
    a.postal_code,
    subdivision
FROM public.areas a,
     jsonb_array_elements_text(COALESCE(a.subdivisions, '[]'::jsonb)) as subdivision
WHERE a.is_active = TRUE 
ORDER BY a.name, subdivision;

-- 5. Create residents_view for collector app
DROP VIEW IF EXISTS public.residents_view CASCADE;

CREATE VIEW public.residents_view AS
SELECT 
    u.id,
    u.first_name,
    u.last_name,
    u.full_name,
    u.email,
    u.phone,
    u.date_of_birth,
    u.street_addr,
    u.township_id,
    a_township.name as township_name,
    u.subdivision,
    u.suburb, -- Legacy field for existing users
    u.city,
    u.postal_code,
    u.status,
    u.created_at,
    u.updated_at,
    -- Address completeness indicator
    CASE 
        WHEN u.township_id IS NOT NULL AND u.subdivision IS NOT NULL THEN 'complete'
        WHEN u.suburb IS NOT NULL THEN 'legacy'
        ELSE 'incomplete'
    END as address_status
FROM public.users u
LEFT JOIN public.areas a_township ON u.township_id = a_township.id
WHERE u.role_id = (SELECT id FROM public.roles WHERE name = 'resident')
ORDER BY u.created_at DESC;

-- 6. Create collector_residents view
DROP VIEW IF EXISTS public.collector_residents CASCADE;

CREATE VIEW public.collector_residents AS
SELECT 
    r.*,
    c.area_id as collector_area_id,
    a_collector.name as collector_area_name
FROM public.residents_view r
CROSS JOIN public.users c
LEFT JOIN public.areas a_collector ON c.area_id = a_collector.id
WHERE c.id = auth.uid() 
AND c.role_id = (SELECT id FROM public.roles WHERE name = 'collector')
ORDER BY r.created_at DESC;

-- 7. Grant permissions on all views
GRANT SELECT ON public.township_dropdown TO authenticated;
GRANT SELECT ON public.subdivision_dropdown TO authenticated;
GRANT SELECT ON public.residents_view TO authenticated;
GRANT SELECT ON public.collector_residents TO authenticated;

-- 8. Fix the persistent member role issue
-- First, ensure roles table exists
CREATE TABLE IF NOT EXISTS public.roles (
    id text PRIMARY KEY,
    name text UNIQUE NOT NULL,
    description text,
    permissions jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for roles table
DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON public.roles;
CREATE POLICY "Allow authenticated users to read roles" ON public.roles
    FOR SELECT TO authenticated
    USING (true);

-- Insert essential roles if they don't exist
INSERT INTO public.roles (id, name, description) VALUES
    ('member', 'member', 'Regular member/resident'),
    ('resident', 'resident', 'Resident user'),
    ('collector', 'collector', 'Waste collector'),
    ('admin', 'admin', 'System administrator'),
    ('office_staff', 'office_staff', 'Office staff member')
ON CONFLICT (id) DO NOTHING;

-- 9. Verify the views were created successfully
SELECT 'township_dropdown view created successfully' as status;
SELECT 'subdivision_dropdown view created successfully' as status;
SELECT 'residents_view created successfully' as status;
SELECT 'collector_residents view created successfully' as status;

-- 10. Test the views
SELECT 'Testing township_dropdown view...' as test_status;
SELECT COUNT(*) as township_count FROM public.township_dropdown;

SELECT 'Testing subdivision_dropdown view...' as test_status;
SELECT COUNT(*) as subdivision_count FROM public.subdivision_dropdown;

SELECT 'Testing residents_view...' as test_status;
SELECT COUNT(*) as residents_count FROM public.residents_view;

-- 11. Verify roles
SELECT 'Testing roles table...' as test_status;
SELECT id, name FROM public.roles ORDER BY name;

-- 12. Show sample data from township_dropdown
SELECT 'Sample township data:' as sample_status;
SELECT township_name, city, postal_code FROM public.township_dropdown LIMIT 5;

SELECT 'All views and roles fixed successfully!' as final_status;
