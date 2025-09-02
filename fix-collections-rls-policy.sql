-- Fix RLS Policy for Collections Table
-- Allow collectors to create collections on behalf of customers

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Residents can create collections" ON collections;

-- Create a new policy that allows both residents and collectors to create collections
CREATE POLICY "Residents and collectors can create collections" ON collections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('resident', 'collector')
        )
    );

-- Also add a policy to allow collectors to insert collections for any user
-- (since collectors create collections on behalf of customers)
CREATE POLICY "Collectors can create collections for any user" ON collections
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'collector'
        )
    );

-- Fix pickup_items policies to allow collectors to insert items
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Collectors can manage pickup items" ON pickup_items;

-- Create a new policy that allows collectors to insert pickup items
CREATE POLICY "Collectors can insert pickup items" ON pickup_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'collector'
        )
    );

-- Create a policy for collectors to update pickup items
CREATE POLICY "Collectors can update pickup items" ON pickup_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = pickup_items.pickup_id
            AND c.collector_id = auth.uid()
        )
    );

-- Create a policy for collectors to view pickup items
CREATE POLICY "Collectors can view pickup items" ON pickup_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM collections c
            WHERE c.id = pickup_items.pickup_id
            AND c.collector_id = auth.uid()
        )
    );

-- Verify the policies were created
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
    AND tablename = 'collections'
ORDER BY policyname;
