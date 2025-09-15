-- Fix Collector Permissions for Supabase Database
-- This script sets up proper Row Level Security (RLS) policies for collectors

-- 1. Enable RLS on the profiles table if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Create a policy that allows collectors to read customer profiles
CREATE POLICY "Collectors can read customer profiles" ON profiles
    FOR SELECT
    TO authenticated
    USING (
        -- Allow collectors to read customer profiles
        (auth.jwt() ->> 'role')::text = 'collector' AND role = 'customer'
        OR
        -- Allow admins to read all profiles
        (auth.jwt() ->> 'role')::text = 'admin'
        OR
        -- Allow users to read their own profile
        id = auth.uid()
    );

-- 3. Create a policy that allows collectors to read addresses
CREATE POLICY "Collectors can read customer addresses" ON addresses
    FOR SELECT
    TO authenticated
    USING (
        -- Allow collectors to read addresses of customer profiles
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = addresses.profile_id 
            AND profiles.role = 'customer'
        )
        OR
        -- Allow admins to read all addresses
        (auth.jwt() ->> 'role')::text = 'admin'
        OR
        -- Allow users to read addresses of their own profile
        profile_id = auth.uid()
    );

-- 4. Create a policy that allows collectors to read pickups
CREATE POLICY "Collectors can read their own pickups" ON pickups
    FOR SELECT
    TO authenticated
    USING (
        -- Allow collectors to read pickups they're assigned to
        collector_id = auth.uid()
        OR
        -- Allow admins to read all pickups
        (auth.jwt() ->> 'role')::text = 'admin'
        OR
        -- Allow customers to read their own pickups
        customer_id = auth.uid()
    );

-- 5. Create a policy that allows collectors to create/update pickups
CREATE POLICY "Collectors can manage their pickups" ON pickups
    FOR ALL
    TO authenticated
    USING (
        -- Allow collectors to manage pickups they're assigned to
        collector_id = auth.uid()
        OR
        -- Allow admins to manage all pickups
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 6. Create a policy that allows collectors to read materials
CREATE POLICY "Collectors can read materials" ON materials
    FOR SELECT
    TO authenticated
    USING (
        -- Allow all authenticated users to read materials
        is_active = true
    );

-- 7. Create a policy that allows collectors to read pickup items
CREATE POLICY "Collectors can read pickup items" ON pickup_items
    FOR SELECT
    TO authenticated
    USING (
        -- Allow collectors to read items of pickups they're assigned to
        EXISTS (
            SELECT 1 FROM pickups 
            WHERE pickups.id = pickup_items.pickup_id 
            AND pickups.collector_id = auth.uid()
        )
        OR
        -- Allow admins to read all pickup items
        (auth.jwt() ->> 'role')::text = 'admin'
        OR
        -- Allow customers to read items of their own pickups
        EXISTS (
            SELECT 1 FROM pickups 
            WHERE pickups.id = pickup_items.pickup_id 
            AND pickups.customer_id = auth.uid()
        )
    );

-- 8. Create a policy that allows collectors to manage pickup items
CREATE POLICY "Collectors can manage pickup items" ON pickup_items
    FOR ALL
    TO authenticated
    USING (
        -- Allow collectors to manage items of pickups they're assigned to
        EXISTS (
            SELECT 1 FROM pickups 
            WHERE pickups.id = pickup_items.pickup_id 
            AND pickups.collector_id = auth.uid()
        )
        OR
        -- Allow admins to manage all pickup items
        (auth.jwt() ->> 'role')::text = 'admin'
    );

-- 9. Create a policy that allows collectors to manage pickup photos
CREATE POLICY "Collectors can manage pickup photos" ON pickup_photos
    FOR ALL
    TO authenticated
    USING (
        -- Allow collectors to manage photos of pickups they're assigned to
        EXISTS (
            SELECT 1 FROM pickups 
            WHERE pickups.id = pickup_photos.pickup_id 
            AND pickups.collector_id = auth.uid()
        )
        OR
        -- Allow admins to manage all pickup photos
        (auth.jwt() ->> 'role')::text = 'admin'
        OR
        -- Allow customers to manage photos of their own pickups
        EXISTS (
            SELECT 1 FROM pickups 
            WHERE pickups.id = pickup_photos.pickup_id 
            AND pickups.customer_id = auth.uid()
        )
    );

-- 10. Grant necessary permissions to the authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

-- 11. Grant sequence permissions for auto-incrementing IDs
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 12. Create a function to check if user is a collector
CREATE OR REPLACE FUNCTION is_collector()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'role')::text = 'collector';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create a function to check if user is an admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (auth.jwt() ->> 'role')::text = 'admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create a function to get user's collector ID
CREATE OR REPLACE FUNCTION get_collector_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Test the policies by checking if they exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- 16. Check RLS status on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;
