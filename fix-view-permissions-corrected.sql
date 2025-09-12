-- ============================================================================
-- FIX VIEW PERMISSIONS FOR ALL THREE APPS - CORRECTED
-- ============================================================================
-- This script fixes permissions for the views so all apps can access them

-- 1. Grant permissions to all users (views inherit from underlying tables)
GRANT SELECT ON township_dropdown TO anon;
GRANT SELECT ON subdivision_dropdown TO anon;
GRANT SELECT ON residents_view TO anon;
GRANT SELECT ON collector_residents TO anon;

GRANT SELECT ON township_dropdown TO authenticated;
GRANT SELECT ON subdivision_dropdown TO authenticated;
GRANT SELECT ON residents_view TO authenticated;
GRANT SELECT ON collector_residents TO authenticated;

-- 2. Ensure the underlying tables have proper RLS policies
-- Check if areas table has proper RLS
DO $$
BEGIN
    -- Enable RLS on areas table if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'areas' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policy for areas table if it doesn't exist
DROP POLICY IF EXISTS "Allow all users to view areas" ON public.areas;
CREATE POLICY "Allow all users to view areas" ON public.areas
    FOR SELECT TO anon, authenticated
    USING (true);

-- 3. Ensure users table has proper RLS policies
DO $$
BEGIN
    -- Enable RLS on users table if not already enabled
    IF NOT EXISTS (
        SELECT 1 FROM pg_class 
        WHERE relname = 'users' 
        AND relrowsecurity = true
    ) THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policy for users table if it doesn't exist
DROP POLICY IF EXISTS "Allow all users to view users" ON public.users;
CREATE POLICY "Allow all users to view users" ON public.users
    FOR SELECT TO anon, authenticated
    USING (true);

-- 4. Test the permissions
SELECT 'Testing view permissions...' as status;

-- Test township access
SELECT COUNT(*) as township_count FROM township_dropdown;

-- Test subdivision access  
SELECT COUNT(*) as subdivision_count FROM subdivision_dropdown;

-- Test residents access
SELECT COUNT(*) as residents_count FROM residents_view;

-- 5. Show sample data to verify it's working
SELECT 'Sample township data:' as status;
SELECT id, township_name, postal_code, city, jsonb_array_length(subdivisions) as subdivision_count
FROM township_dropdown 
ORDER BY township_name 
LIMIT 3;

SELECT 'Sample subdivision data for Dobsonville:' as status;
SELECT area_id, township_name, subdivision, postal_code
FROM subdivision_dropdown 
WHERE township_name = 'Dobsonville'
ORDER BY subdivision
LIMIT 5;

SELECT 'View permissions fixed successfully!' as status;
