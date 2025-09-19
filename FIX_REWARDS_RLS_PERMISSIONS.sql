-- Fix RLS permissions for rewards table
-- The issue is that role_id is a UUID foreign key, not a string

-- Drop existing policies
DROP POLICY IF EXISTS "Allow authenticated users to read rewards" ON public.rewards;
DROP POLICY IF EXISTS "Allow office users to manage rewards" ON public.rewards;

-- Create corrected RLS policies
-- Allow all authenticated users to read rewards
CREATE POLICY "Allow authenticated users to read rewards" ON public.rewards
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users with admin, office, or staff roles to manage rewards
CREATE POLICY "Allow admin and office users to manage rewards" ON public.rewards
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON u.role_id = r.id
            WHERE u.id = auth.uid() 
            AND r.name IN ('admin', 'office', 'staff', 'SUPER_ADMIN', 'ADMIN', 'STAFF')
        )
    );

-- Alternative: If the above doesn't work, try this simpler approach
-- Allow all authenticated users to manage rewards (for testing)
-- DROP POLICY IF EXISTS "Allow admin and office users to manage rewards" ON public.rewards;
-- CREATE POLICY "Allow all authenticated users to manage rewards" ON public.rewards
--     FOR ALL
--     TO authenticated
--     USING (true);
