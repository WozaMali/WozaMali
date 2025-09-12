-- ============================================================================
-- UNIFIED DATABASE FIX FOR ALL THREE APPS - CLEAN VERSION
-- ============================================================================
-- This script fixes the missing views that all three apps depend on

-- 1. First, check if Section 1 tables exist
SELECT 'Checking Section 1 tables...' as status;

-- Check if roles table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') THEN
        RAISE EXCEPTION 'roles table does not exist. Please run section-1-core-identity.sql first.';
    END IF;
END $$;

-- Check if areas table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'areas') THEN
        RAISE EXCEPTION 'areas table does not exist. Please run section-1-core-identity.sql first.';
    END IF;
END $$;

-- Check if users table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        RAISE EXCEPTION 'users table does not exist. Please run section-1-core-identity.sql first.';
    END IF;
END $$;

-- 2. Create township_dropdown view
DROP VIEW IF EXISTS township_dropdown CASCADE;

CREATE VIEW township_dropdown AS
SELECT 
    a.id,
    a.name as township_name,
    a.postal_code,
    a.city,
    COALESCE(a.subdivisions, '[]'::jsonb) as subdivisions
FROM public.areas a
WHERE a.is_active = true
ORDER BY a.name;

-- 3. Create subdivision_dropdown view
DROP VIEW IF EXISTS subdivision_dropdown CASCADE;

CREATE VIEW subdivision_dropdown AS
SELECT 
    a.id as area_id,
    a.name as township_name,
    a.postal_code,
    jsonb_array_elements_text(COALESCE(a.subdivisions, '[]'::jsonb)) as subdivision
FROM public.areas a
WHERE a.is_active = true
ORDER BY a.name, subdivision;

-- 4. Create residents_view
DROP VIEW IF EXISTS residents_view CASCADE;

CREATE VIEW residents_view AS
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
    a.name as township_name,
    u.subdivision,
    u.suburb, -- Legacy field
    u.city,
    u.postal_code,
    u.status,
    u.created_at,
    u.updated_at,
    CASE 
        WHEN u.township_id IS NOT NULL AND u.subdivision IS NOT NULL THEN 'complete'
        WHEN u.suburb IS NOT NULL THEN 'legacy'
        ELSE 'incomplete'
    END as address_status
FROM public.users u
LEFT JOIN public.areas a ON u.township_id = a.id
WHERE u.status = 'active';

-- 5. Create collector_residents view (for Collector App)
DROP VIEW IF EXISTS collector_residents CASCADE;

CREATE VIEW collector_residents AS
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
    a.name as township_name,
    u.subdivision,
    u.suburb, -- Legacy field
    u.city,
    u.postal_code,
    u.status,
    u.created_at,
    u.updated_at,
    CASE 
        WHEN u.township_id IS NOT NULL AND u.subdivision IS NOT NULL THEN 'complete'
        WHEN u.suburb IS NOT NULL THEN 'legacy'
        ELSE 'incomplete'
    END as address_status
FROM public.users u
LEFT JOIN public.areas a ON u.township_id = a.id
WHERE u.status = 'active';

-- 6. Grant permissions to authenticated users
GRANT SELECT ON township_dropdown TO authenticated;
GRANT SELECT ON subdivision_dropdown TO authenticated;
GRANT SELECT ON residents_view TO authenticated;
GRANT SELECT ON collector_residents TO authenticated;

-- 7. Test the views
SELECT 'Testing township_dropdown view...' as status;
SELECT COUNT(*) as township_count FROM township_dropdown;

SELECT 'Testing subdivision_dropdown view...' as status;
SELECT COUNT(*) as subdivision_count FROM subdivision_dropdown;

SELECT 'Testing residents_view...' as status;
SELECT COUNT(*) as residents_count FROM residents_view;

-- 8. Show sample data
SELECT 'Sample township data:' as status;
SELECT id, township_name, postal_code, city, jsonb_array_length(subdivisions) as subdivision_count
FROM township_dropdown 
ORDER BY township_name 
LIMIT 5;

SELECT 'Sample subdivision data:' as status;
SELECT area_id, township_name, subdivision, postal_code
FROM subdivision_dropdown 
WHERE township_name = 'Dobsonville'
ORDER BY subdivision
LIMIT 5;

SELECT 'Sample residents data:' as status;
SELECT id, full_name, email, township_name, subdivision, address_status
FROM residents_view 
ORDER BY created_at DESC 
LIMIT 5;

-- 9. Verify all apps can access the data
SELECT 'Database views created successfully!' as status;
SELECT 'All three apps (Main, Collector, Office) can now access township and subdivision data.' as message;
