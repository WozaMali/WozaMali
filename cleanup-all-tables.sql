-- ============================================================================
-- COMPLETE DATABASE CLEANUP SCRIPT
-- ============================================================================
-- WARNING: This will remove ALL tables and data from your database
-- Run this in your Supabase SQL Editor

-- Disable triggers temporarily to avoid foreign key constraint issues
SET session_replication_role = replica;

-- Drop all tables in the correct order (respecting foreign key constraints)

-- Drop pickup-related tables first
DROP TABLE IF EXISTS public.pickup_photos CASCADE;
DROP TABLE IF EXISTS public.pickup_items CASCADE;
DROP TABLE IF EXISTS public.pickups CASCADE;

-- Drop address and location tables
DROP TABLE IF EXISTS public.addresses CASCADE;
DROP TABLE IF EXISTS public.location_zones CASCADE;
DROP TABLE IF EXISTS public.collection_areas CASCADE;

-- Drop material and pricing tables
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.material_prices CASCADE;
DROP TABLE IF EXISTS public.pricing_tiers CASCADE;

-- Drop user management tables
DROP TABLE IF EXISTS public.user_permissions CASCADE;
DROP TABLE IF EXISTS public.user_sessions CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Drop rewards and points tables
DROP TABLE IF EXISTS public.rewards CASCADE;
DROP TABLE IF EXISTS public.user_points CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;
DROP TABLE IF EXISTS public.reward_tiers CASCADE;

-- Drop collection and route tables
DROP TABLE IF EXISTS public.collection_routes CASCADE;
DROP TABLE IF EXISTS public.route_assignments CASCADE;
DROP TABLE IF EXISTS public.collection_schedules CASCADE;

-- Drop analytics and reporting tables
DROP TABLE IF EXISTS public.collection_analytics CASCADE;
DROP TABLE IF EXISTS public.performance_metrics CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;

-- Drop notification and communication tables
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.communications CASCADE;

-- Drop audit and logging tables
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.system_logs CASCADE;
DROP TABLE IF EXISTS public.error_logs CASCADE;

-- Drop any remaining custom tables
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.collectors CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.staff CASCADE;

-- Re-enable triggers
SET session_replication_role = DEFAULT;

-- Verify all tables are removed
SELECT 
    schemaname,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Clean up any remaining sequences
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END $$;

-- Final verification - should show no tables
SELECT 
    'Remaining tables:' as status,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public';

-- Clean up any orphaned functions or procedures
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.calculate_rewards() CASCADE;

-- Reset the database to a clean state
-- Note: This preserves the auth.users table (Supabase managed)
-- but removes all custom tables and data
