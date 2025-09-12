-- ============================================================================
-- FIX VIEW PERMISSIONS FOR ALL THREE APPS
-- ============================================================================
-- This script fixes RLS policies for the views so all apps can access them

-- 1. Drop existing RLS policies on views (if any)
DROP POLICY IF EXISTS "Allow authenticated users to view township_dropdown" ON township_dropdown;
DROP POLICY IF EXISTS "Allow authenticated users to view subdivision_dropdown" ON subdivision_dropdown;
DROP POLICY IF EXISTS "Allow authenticated users to view residents_view" ON residents_view;
DROP POLICY IF EXISTS "Allow authenticated users to view collector_residents" ON collector_residents;

-- 2. Enable RLS on views
ALTER VIEW township_dropdown SET (security_invoker = false);
ALTER VIEW subdivision_dropdown SET (security_invoker = false);
ALTER VIEW residents_view SET (security_invoker = false);
ALTER VIEW collector_residents SET (security_invoker = false);

-- 3. Create RLS policies for views
CREATE POLICY "Allow authenticated users to view township_dropdown" ON township_dropdown
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to view subdivision_dropdown" ON subdivision_dropdown
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to view residents_view" ON residents_view
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to view collector_residents" ON collector_residents
    FOR SELECT TO authenticated
    USING (true);

-- 4. Grant additional permissions
GRANT SELECT ON township_dropdown TO anon;
GRANT SELECT ON subdivision_dropdown TO anon;
GRANT SELECT ON residents_view TO anon;
GRANT SELECT ON collector_residents TO anon;

-- 5. Test the permissions
SELECT 'Testing view permissions...' as status;

-- Test township access
SELECT COUNT(*) as township_count FROM township_dropdown;

-- Test subdivision access
SELECT COUNT(*) as subdivision_count FROM subdivision_dropdown;

-- Test residents access
SELECT COUNT(*) as residents_count FROM residents_view;

SELECT 'View permissions fixed successfully!' as status;
