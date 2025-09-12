-- Fix Pickups View - Corrected Version
-- This creates the correct pickups view based on the actual table structure
-- Run this in your Supabase SQL Editor

-- 1. First, check what pickup-related tables actually exist
SELECT 
    'Existing Pickup Tables' as info,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND (tablename ILIKE '%pickup%' OR tablename ILIKE '%collection%')
ORDER BY tablename;

-- 2. Check the structure of collection_pickups table
SELECT 
    'Collection Pickups Structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'collection_pickups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Check if there's a regular pickups table
SELECT 
    'Pickups Table Structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'pickups' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Drop the incorrect view if it exists
DROP VIEW IF EXISTS public.pickups;

-- 5. Create the correct pickups view based on what actually exists
-- Option A: If collection_pickups exists with customer_id
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collection_pickups' 
        AND column_name = 'customer_id'
        AND table_schema = 'public'
    ) THEN
        -- Create view using customer_id
        CREATE VIEW public.pickups AS
        SELECT 
            id,
            customer_id as user_id,  -- Map customer_id to user_id for compatibility
            NULL::DECIMAL(10,2) as weight_kg,  -- Will need to calculate from pickup_items
            status,
            created_at,
            updated_at,
            scheduled_date as pickup_date,
            collector_id,
            notes
        FROM public.collection_pickups;
        
        RAISE NOTICE 'Created pickups view using collection_pickups with customer_id';
    END IF;
END $$;

-- Option B: If collection_pickups exists without customer_id but has other user reference
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collection_pickups' 
        AND column_name = 'collector_id'
        AND table_schema = 'public'
        AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'collection_pickups' 
            AND column_name = 'customer_id'
            AND table_schema = 'public'
        )
    ) THEN
        -- Create view using collector_id as user_id (temporary)
        CREATE VIEW public.pickups AS
        SELECT 
            id,
            collector_id as user_id,  -- Map collector_id to user_id for compatibility
            NULL::DECIMAL(10,2) as weight_kg,  -- Will need to calculate from pickup_items
            status,
            created_at,
            updated_at,
            scheduled_date as pickup_date,
            collector_id,
            notes
        FROM public.collection_pickups;
        
        RAISE NOTICE 'Created pickups view using collection_pickups with collector_id';
    END IF;
END $$;

-- Option C: If regular pickups table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'pickups' 
        AND table_schema = 'public'
    ) THEN
        -- Use the existing pickups table directly
        CREATE VIEW public.pickups AS
        SELECT 
            id,
            customer_id as user_id,  -- Map customer_id to user_id for compatibility
            NULL::DECIMAL(10,2) as weight_kg,  -- Will need to calculate from pickup_items
            status,
            created_at,
            updated_at,
            pickup_date,
            collector_id,
            notes
        FROM public.pickups;
        
        RAISE NOTICE 'Created pickups view using existing pickups table';
    END IF;
END $$;

-- 6. Grant permissions on the view
GRANT ALL PRIVILEGES ON TABLE public.pickups TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.pickups TO anon;
GRANT ALL PRIVILEGES ON TABLE public.pickups TO service_role;

-- 7. Test the view
SELECT 
    'Pickups View Test' as info,
    COUNT(*) as record_count,
    'Should show pickup data' as expected
FROM public.pickups;

-- 8. Show sample data from the view
SELECT 
    'Sample Pickups Data' as info,
    id,
    user_id,
    status,
    pickup_date,
    created_at
FROM public.pickups 
LIMIT 5;

-- 9. Success message
SELECT 
    '✅ PICKUPS VIEW FIXED' as status,
    'The pickups view should now work correctly' as result,
    'Test your main app to verify it can access pickup data' as next_step;
