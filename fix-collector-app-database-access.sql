-- ============================================================================
-- FIX COLLECTOR APP DATABASE ACCESS
-- ============================================================================
-- This script gives the collector app access to all necessary tables
-- using the same approach as the users page (simple RLS policies)

-- 1. Fix materials table access
-- Drop existing policies
DROP POLICY IF EXISTS "materials_select_policy" ON public.materials;
DROP POLICY IF EXISTS "materials_insert_policy" ON public.materials;
DROP POLICY IF EXISTS "materials_update_policy" ON public.materials;
DROP POLICY IF EXISTS "materials_delete_policy" ON public.materials;

-- Enable RLS on materials table
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;

-- Create simple policies for materials
CREATE POLICY "materials_select_policy" ON public.materials
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "materials_insert_policy" ON public.materials
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "materials_update_policy" ON public.materials
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "materials_delete_policy" ON public.materials
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.materials TO authenticated;

-- 2. Fix roles table access
-- Drop existing policies
DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
DROP POLICY IF EXISTS "roles_insert_policy" ON public.roles;
DROP POLICY IF EXISTS "roles_update_policy" ON public.roles;

-- Enable RLS on roles table
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- Create simple policies for roles
CREATE POLICY "roles_select_policy" ON public.roles
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "roles_insert_policy" ON public.roles
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "roles_update_policy" ON public.roles
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.roles TO authenticated;

-- 3. Fix collections table access
-- Drop existing policies
DROP POLICY IF EXISTS "collections_select_policy" ON public.collections;
DROP POLICY IF EXISTS "collections_insert_policy" ON public.collections;
DROP POLICY IF EXISTS "collections_update_policy" ON public.collections;
DROP POLICY IF EXISTS "collections_delete_policy" ON public.collections;

-- Enable RLS on collections table
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- Create simple policies for collections
CREATE POLICY "collections_select_policy" ON public.collections
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "collections_insert_policy" ON public.collections
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "collections_update_policy" ON public.collections
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "collections_delete_policy" ON public.collections
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.collections TO authenticated;

-- 4. Fix wallets table access
-- Drop existing policies
DROP POLICY IF EXISTS "wallets_select_policy" ON public.wallets;
DROP POLICY IF EXISTS "wallets_insert_policy" ON public.wallets;
DROP POLICY IF EXISTS "wallets_update_policy" ON public.wallets;
DROP POLICY IF EXISTS "wallets_delete_policy" ON public.wallets;

-- Enable RLS on wallets table
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

-- Create simple policies for wallets
CREATE POLICY "wallets_select_policy" ON public.wallets
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "wallets_insert_policy" ON public.wallets
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "wallets_update_policy" ON public.wallets
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "wallets_delete_policy" ON public.wallets
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallets TO authenticated;

-- 5. Fix transactions table access
-- Drop existing policies
DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_policy" ON public.transactions;

-- Enable RLS on transactions table
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create simple policies for transactions
CREATE POLICY "transactions_select_policy" ON public.transactions
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "transactions_insert_policy" ON public.transactions
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "transactions_update_policy" ON public.transactions
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "transactions_delete_policy" ON public.transactions
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transactions TO authenticated;

-- 6. Fix areas table access
-- Drop existing policies
DROP POLICY IF EXISTS "areas_select_policy" ON public.areas;
DROP POLICY IF EXISTS "areas_insert_policy" ON public.areas;
DROP POLICY IF EXISTS "areas_update_policy" ON public.areas;
DROP POLICY IF EXISTS "areas_delete_policy" ON public.areas;

-- Enable RLS on areas table
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- Create simple policies for areas
CREATE POLICY "areas_select_policy" ON public.areas
    FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "areas_insert_policy" ON public.areas
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "areas_update_policy" ON public.areas
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "areas_delete_policy" ON public.areas
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.areas TO authenticated;

-- 7. Test all table access
SELECT 'Testing materials table access...' as test_status;
SELECT COUNT(*) as materials_count FROM public.materials;

SELECT 'Testing roles table access...' as test_status;
SELECT COUNT(*) as roles_count FROM public.roles;

SELECT 'Testing collections table access...' as test_status;
SELECT COUNT(*) as collections_count FROM public.collections;

SELECT 'Testing wallets table access...' as test_status;
SELECT COUNT(*) as wallets_count FROM public.wallets;

SELECT 'Testing transactions table access...' as test_status;
SELECT COUNT(*) as transactions_count FROM public.transactions;

SELECT 'Testing areas table access...' as test_status;
SELECT COUNT(*) as areas_count FROM public.areas;

SELECT 'Testing users table access...' as test_status;
SELECT COUNT(*) as users_count FROM public.users;

-- 8. Show sample data from each table
SELECT 'Sample materials:' as sample_status;
SELECT id, name, is_active FROM public.materials LIMIT 3;

SELECT 'Sample roles:' as sample_status;
SELECT id, name, description FROM public.roles LIMIT 3;

SELECT 'Sample collections:' as sample_status;
SELECT id, user_id, collector_id, weight_kg, status FROM public.collections LIMIT 3;

SELECT 'Sample users:' as sample_status;
SELECT id, full_name, email, role_id, status FROM public.users LIMIT 3;

SELECT 'Collector app database access fixed successfully!' as final_status;
