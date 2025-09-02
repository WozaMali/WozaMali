-- ============================================================================
-- UPDATE OFFICE APP VIEWS FOR UNIFIED SCHEMA
-- ============================================================================
-- This script updates the WozaMaliOffice app database views to work with
-- the unified user_addresses table instead of the old address system

-- ============================================================================
-- STEP 1: DROP OLD VIEWS
-- ============================================================================

-- Drop existing views that reference old address tables
DROP VIEW IF EXISTS public.collection_member_user_addresses_view CASCADE;
DROP VIEW IF EXISTS public.collection_member_addresses_view CASCADE;
DROP VIEW IF EXISTS public.member_user_addresses_view CASCADE;
DROP VIEW IF EXISTS public.office_member_user_addresses_view CASCADE;
DROP VIEW IF EXISTS public.member_addresses_view CASCADE;
DROP VIEW IF EXISTS public.member_addresses_with_pickups_view CASCADE;
DROP VIEW IF EXISTS public.office_member_addresses_view CASCADE;

-- ============================================================================
-- STEP 2: CREATE UPDATED VIEWS FOR UNIFIED SCHEMA
-- ============================================================================

-- Create collection member user addresses view (for collector app)
CREATE OR REPLACE VIEW public.collection_member_user_addresses_view AS
SELECT 
    ua.id as address_id,
    ua.user_id as member_id,
    u.name as member_name,
    u.phone as member_phone,
    u.email as member_email,
    u.role as member_role,
    ua.address_type,
    ua.address_line1,
    ua.address_line2,
    ua.city,
    ua.province,
    ua.postal_code,
    ua.country,
    ua.coordinates,
    ua.is_default,
    ua.is_active,
    ua.notes,
    ua.created_at,
    ua.updated_at,
    -- Formatted address for display
    CONCAT(
        ua.address_line1,
        CASE WHEN ua.address_line2 IS NOT NULL AND ua.address_line2 != '' THEN ', ' || ua.address_line2 ELSE '' END,
        ', ', ua.city, ', ', ua.province,
        CASE WHEN ua.postal_code IS NOT NULL AND ua.postal_code != '' THEN ', ' || ua.postal_code ELSE '' END
    ) as display_address,
    -- Short address for lists
    CONCAT(ua.address_line1, ', ', ua.city) as short_address,
    -- Customer status (based on user role and activity)
    CASE 
        WHEN u.role = 'resident' THEN 'active'
        WHEN u.role = 'collector' THEN 'collector'
        WHEN u.role = 'office' THEN 'office'
        ELSE 'inactive'
    END as customer_status,
    -- Collection statistics
    COALESCE(c.total_collections, 0) as total_collections,
    COALESCE(c.last_collection_date, u.created_at) as last_collection_date,
    COALESCE(c.total_weight_kg, 0) as total_weight_kg
FROM user_addresses ua
INNER JOIN users u ON ua.user_id = u.id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_collections,
        MAX(created_at) as last_collection_date,
        SUM(weight_kg) as total_weight_kg
    FROM collections 
    WHERE status = 'approved'
    GROUP BY user_id
) c ON u.id = c.user_id
WHERE ua.is_active = true
ORDER BY u.name, ua.address_type;

-- Create office member user addresses view (for office app)
CREATE OR REPLACE VIEW public.office_member_user_addresses_view AS
SELECT 
    ua.id as address_id,
    ua.user_id as member_id,
    u.name as member_name,
    u.phone as member_phone,
    u.email as member_email,
    u.role as member_role,
    a.name as area_name,
    ua.address_type,
    ua.address_line1,
    ua.address_line2,
    ua.city,
    ua.province,
    ua.postal_code,
    ua.country,
    ua.coordinates,
    ua.is_default,
    ua.is_active,
    ua.notes,
    ua.created_at,
    ua.updated_at,
    -- Formatted address for display
    CONCAT(
        ua.address_line1,
        CASE WHEN ua.address_line2 IS NOT NULL AND ua.address_line2 != '' THEN ', ' || ua.address_line2 ELSE '' END,
        ', ', ua.city, ', ', ua.province,
        CASE WHEN ua.postal_code IS NOT NULL AND ua.postal_code != '' THEN ', ' || ua.postal_code ELSE '' END
    ) as display_address,
    -- Short address for lists
    CONCAT(ua.address_line1, ', ', ua.city) as short_address,
    -- Customer status (based on user role and activity)
    CASE 
        WHEN u.role = 'resident' THEN 'active'
        WHEN u.role = 'collector' THEN 'collector'
        WHEN u.role = 'office' THEN 'office'
        ELSE 'inactive'
    END as customer_status,
    -- Collection statistics
    COALESCE(c.total_collections, 0) as total_collections,
    COALESCE(c.pending_collections, 0) as pending_collections,
    COALESCE(c.approved_collections, 0) as approved_collections,
    COALESCE(c.last_collection_date, u.created_at) as last_collection_date,
    COALESCE(c.total_weight_kg, 0) as total_weight_kg,
    -- Transaction statistics
    COALESCE(t.total_points, 0) as total_points,
    COALESCE(t.total_transactions, 0) as total_transactions
FROM user_addresses ua
INNER JOIN users u ON ua.user_id = u.id
LEFT JOIN areas a ON u.area_id = a.id
LEFT JOIN (
    SELECT 
        user_id,
        COUNT(*) as total_collections,
        COUNT(*) FILTER (WHERE status = 'pending') as pending_collections,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_collections,
        MAX(created_at) as last_collection_date,
        SUM(weight_kg) as total_weight_kg
    FROM collections 
    GROUP BY user_id
) c ON u.id = c.user_id
LEFT JOIN (
    SELECT 
        user_id,
        SUM(points) as total_points,
        COUNT(*) as total_transactions
    FROM transactions 
    GROUP BY user_id
) t ON u.id = t.user_id
WHERE ua.is_active = true
ORDER BY u.name, ua.address_type;

-- Create simplified member addresses view (backward compatibility)
CREATE OR REPLACE VIEW public.member_user_addresses_view AS
SELECT 
    ua.id as address_id,
    ua.user_id as member_id,
    u.name as member_name,
    u.phone as member_phone,
    u.email as member_email,
    ua.address_type,
    ua.address_line1,
    ua.address_line2,
    ua.city,
    ua.province,
    ua.postal_code,
    ua.country,
    ua.coordinates,
    ua.is_default,
    ua.is_active,
    ua.notes,
    ua.created_at,
    ua.updated_at,
    -- Formatted address for display
    CONCAT(
        ua.address_line1,
        CASE WHEN ua.address_line2 IS NOT NULL AND ua.address_line2 != '' THEN ', ' || ua.address_line2 ELSE '' END,
        ', ', ua.city, ', ', ua.province,
        CASE WHEN ua.postal_code IS NOT NULL AND ua.postal_code != '' THEN ', ' || ua.postal_code ELSE '' END
    ) as display_address,
    -- Short address for lists
    CONCAT(ua.address_line1, ', ', ua.city) as short_address
FROM user_addresses ua
INNER JOIN users u ON ua.user_id = u.id
WHERE ua.is_active = true
ORDER BY u.name, ua.address_type;

-- ============================================================================
-- STEP 3: GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions on the new views
GRANT SELECT ON public.collection_member_user_addresses_view TO authenticated;
GRANT SELECT ON public.office_member_user_addresses_view TO authenticated;
GRANT SELECT ON public.member_user_addresses_view TO authenticated;

-- ============================================================================
-- STEP 4: VERIFICATION QUERIES
-- ============================================================================

-- Test collection member view
SELECT 
    'Collection View Test' as test_type,
    COUNT(*) as total_addresses,
    COUNT(DISTINCT member_id) as unique_members,
    COUNT(*) FILTER (WHERE customer_status = 'active') as active_customers,
    COUNT(*) FILTER (WHERE address_type = 'pickup') as pickup_addresses
FROM public.collection_member_user_addresses_view;

-- Test office member view
SELECT 
    'Office View Test' as test_type,
    COUNT(*) as total_addresses,
    COUNT(DISTINCT member_id) as unique_members,
    COUNT(*) FILTER (WHERE customer_status = 'active') as active_customers,
    COUNT(*) FILTER (WHERE address_type = 'primary') as primary_addresses
FROM public.office_member_user_addresses_view;

-- Show sample data from collection view
SELECT 
    'Sample Collection Addresses' as test_type,
    member_id,
    member_name,
    address_type,
    short_address,
    customer_status,
    total_collections
FROM public.collection_member_user_addresses_view
LIMIT 5;

-- Show sample data from office view
SELECT 
    'Sample Office Addresses' as test_type,
    member_id,
    member_name,
    area_name,
    address_type,
    short_address,
    customer_status,
    total_collections,
    total_points
FROM public.office_member_user_addresses_view
LIMIT 5;

-- ============================================================================
-- OFFICE APP VIEWS UPDATE COMPLETE! 🎉
-- ============================================================================
-- The WozaMaliOffice app views have been updated to work with the unified schema
-- All views now use the user_addresses table instead of the old address system
-- ============================================================================
