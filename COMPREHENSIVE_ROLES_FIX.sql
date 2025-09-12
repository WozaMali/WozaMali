-- ============================================================================
-- COMPREHENSIVE ROLES FIX
-- ============================================================================
-- This script fixes all potential issues with the roles table
-- ============================================================================

-- Step 1: Ensure roles table exists with proper structure
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Disable RLS temporarily to ensure we can insert data
ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;

-- Step 3: Insert all essential roles
INSERT INTO public.roles (name, description, permissions) 
VALUES 
    ('member', 'Regular users who can submit collection requests', '{"can_submit_collections": true, "can_view_own_data": true}'::jsonb),
    ('collector', 'Waste collection staff', '{"can_collect_waste": true, "can_view_assigned_areas": true}'::jsonb),
    ('admin', 'System administrators', '{"can_manage_all": true, "can_view_analytics": true, "can_manage_users": true}'::jsonb),
    ('office_staff', 'Office staff members', '{"can_view_analytics": true, "can_manage_collections": true}'::jsonb)
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- Step 4: Re-enable RLS with proper policies
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies for roles table
DROP POLICY IF EXISTS "Allow all users to read roles" ON public.roles;
CREATE POLICY "Allow all users to read roles" ON public.roles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow authenticated users to read roles" ON public.roles;
CREATE POLICY "Allow authenticated users to read roles" ON public.roles
    FOR SELECT TO authenticated USING (true);

-- Step 6: Grant necessary permissions
GRANT SELECT ON public.roles TO authenticated;
GRANT SELECT ON public.roles TO anon;

-- Step 7: Verify the roles were created
SELECT 
    'ROLES CREATED SUCCESSFULLY' as status,
    name,
    id,
    description
FROM public.roles
ORDER BY name;

-- Step 8: Test the exact query that was failing
SELECT 
    'MEMBER ROLE TEST' as status,
    id,
    name
FROM public.roles
WHERE name = 'member';

-- Step 9: Check table permissions
SELECT 
    'TABLE PERMISSIONS' as status,
    schemaname,
    tablename,
    rowsecurity,
    hasrls
FROM pg_tables 
WHERE tablename = 'roles' AND schemaname = 'public';

RAISE NOTICE '🎉 COMPREHENSIVE ROLES FIX COMPLETED!';
RAISE NOTICE 'All roles have been created with proper permissions.';
RAISE NOTICE 'Your dashboard should now work without role errors.';
