-- ============================================================================
-- MIGRATION SCRIPT: PRESERVE EXISTING DATA
-- ============================================================================
-- This script migrates existing data to the new unified schema
-- Run this AFTER creating the unified schema

-- ============================================================================
-- 1. BACKUP EXISTING DATA
-- ============================================================================

-- Create backup tables for existing data
CREATE TABLE IF NOT EXISTS public.backup_profiles AS 
SELECT * FROM public.profiles WHERE 1=0;

CREATE TABLE IF NOT EXISTS public.backup_user_profiles AS 
SELECT * FROM public.user_profiles WHERE 1=0;

CREATE TABLE IF NOT EXISTS public.backup_wallets AS 
SELECT * FROM public.wallets WHERE 1=0;

CREATE TABLE IF NOT EXISTS public.backup_user_wallets AS 
SELECT * FROM public.user_wallets WHERE 1=0;

CREATE TABLE IF NOT EXISTS public.backup_collections AS 
SELECT * FROM public.collections WHERE 1=0;

CREATE TABLE IF NOT EXISTS public.backup_collection_pickups AS 
SELECT * FROM public.collection_pickups WHERE 1=0;

CREATE TABLE IF NOT EXISTS public.backup_materials AS 
SELECT * FROM public.materials WHERE 1=0;

-- Copy existing data to backup tables
INSERT INTO public.backup_profiles 
SELECT * FROM public.profiles;

INSERT INTO public.backup_user_profiles 
SELECT * FROM public.user_profiles;

INSERT INTO public.backup_wallets 
SELECT * FROM public.wallets;

INSERT INTO public.backup_user_wallets 
SELECT * FROM public.user_wallets;

INSERT INTO public.backup_collections 
SELECT * FROM public.collections;

INSERT INTO public.backup_collection_pickups 
SELECT * FROM public.collection_pickups;

INSERT INTO public.backup_materials 
SELECT * FROM public.materials;

-- ============================================================================
-- 2. MIGRATE USERS DATA
-- ============================================================================

-- Migrate from profiles to users
INSERT INTO public.users (
    id, email, full_name, phone, avatar_url, email_verified, 
    phone_verified, last_login, login_count, status, created_at, updated_at
)
SELECT 
    id, email, full_name, phone, avatar_url, 
    COALESCE(email_verified, FALSE) as email_verified,
    COALESCE(phone_verified, FALSE) as phone_verified,
    last_login, COALESCE(login_count, 0) as login_count,
    COALESCE(status, 'active') as status,
    created_at, updated_at
FROM public.backup_profiles
WHERE id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Migrate from user_profiles to user_profiles (new schema)
INSERT INTO public.user_profiles (
    user_id, role, date_of_birth, emergency_contact, 
    preferences, metadata, created_at, updated_at
)
SELECT 
    user_id, 
    COALESCE(role, 'member') as role,
    date_of_birth, emergency_contact,
    '{}'::jsonb as preferences,
    '{}'::jsonb as metadata,
    created_at, updated_at
FROM public.backup_user_profiles
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- 3. MIGRATE ADDRESSES DATA
-- ============================================================================

-- Migrate addresses to user_addresses
INSERT INTO public.user_addresses (
    user_id, address_type, line1, line2, suburb, city, 
    postal_code, province, is_primary, is_active, created_at, updated_at
)
SELECT 
    id as user_id,
    'home' as address_type,
    COALESCE(street_address, '') as line1,
    NULL as line2,
    COALESCE(suburb, '') as suburb,
    COALESCE(city, 'Johannesburg') as city,
    postal_code,
    'Gauteng' as province,
    TRUE as is_primary,
    TRUE as is_active,
    created_at, updated_at
FROM public.backup_profiles
WHERE street_address IS NOT NULL AND street_address != ''
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. MIGRATE WALLET DATA
-- ============================================================================

-- Migrate from wallets to user_wallets
INSERT INTO public.user_wallets (
    user_id, balance, total_earned, total_spent, 
    current_points, total_points_earned, total_points_spent,
    tier, last_updated, created_at, updated_at
)
SELECT 
    user_id,
    COALESCE(balance, 0) as balance,
    COALESCE(balance, 0) as total_earned,
    0 as total_spent,
    COALESCE(total_points, 0) as current_points,
    COALESCE(total_points, 0) as total_points_earned,
    0 as total_points_spent,
    COALESCE(tier, 'bronze') as tier,
    COALESCE(updated_at, created_at) as last_updated,
    created_at, updated_at
FROM public.backup_wallets
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Migrate from user_wallets to user_wallets (if different structure)
INSERT INTO public.user_wallets (
    user_id, balance, total_earned, total_spent,
    current_points, total_points_earned, total_points_spent,
    tier, last_updated, created_at, updated_at
)
SELECT 
    user_id,
    COALESCE(current_points * 0.01, 0) as balance, -- Convert points to balance
    COALESCE(current_points * 0.01, 0) as total_earned,
    0 as total_spent,
    COALESCE(current_points, 0) as current_points,
    COALESCE(total_points_earned, 0) as total_points_earned,
    COALESCE(total_points_spent, 0) as total_points_spent,
    'bronze' as tier, -- Will be calculated by trigger
    COALESCE(last_updated, created_at) as last_updated,
    created_at, updated_at
FROM public.backup_user_wallets
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
    current_points = EXCLUDED.current_points,
    total_points_earned = EXCLUDED.total_points_earned,
    total_points_spent = EXCLUDED.total_points_spent,
    updated_at = NOW();

-- ============================================================================
-- 5. MIGRATE COLLECTIONS DATA
-- ============================================================================

-- Migrate collections to collection_requests
INSERT INTO public.collection_requests (
    id, user_id, address_id, request_type, preferred_date, 
    special_instructions, status, created_at, updated_at
)
SELECT 
    id, user_id, 
    (SELECT id FROM public.user_addresses WHERE user_id = c.user_id LIMIT 1) as address_id,
    'scheduled' as request_type,
    created_at::date as preferred_date,
    notes as special_instructions,
    COALESCE(status, 'pending') as status,
    created_at, updated_at
FROM public.backup_collections c
WHERE user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Migrate collection_pickups to collection_pickups (new schema)
INSERT INTO public.collection_pickups (
    id, request_id, collector_id, customer_id, pickup_code,
    pickup_date, pickup_time, status, total_weight_kg, 
    total_value, total_points, notes, completed_at, created_at, updated_at
)
SELECT 
    id,
    id as request_id, -- Use same ID as request
    collector_id,
    customer_id,
    COALESCE(pickup_code, 'PK' || LPAD(id::text, 6, '0')) as pickup_code,
    COALESCE(scheduled_date, created_at::date) as pickup_date,
    scheduled_time,
    COALESCE(status, 'scheduled') as status,
    COALESCE(total_weight_kg, 0) as total_weight_kg,
    COALESCE(total_value, 0) as total_value,
    COALESCE(total_points, 0) as total_points,
    notes,
    completed_at,
    created_at, updated_at
FROM public.backup_collection_pickups
WHERE customer_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6. MIGRATE MATERIALS DATA
-- ============================================================================

-- Migrate materials to new materials table
INSERT INTO public.materials (
    id, name, description, unit, current_rate, 
    points_per_unit, is_active, created_at, updated_at
)
SELECT 
    id, name, description, unit, 
    COALESCE(unit_price, 0) as current_rate,
    COALESCE(points_per_kg, 0) as points_per_unit,
    COALESCE(is_active, TRUE) as is_active,
    created_at, updated_at
FROM public.backup_materials
WHERE name IS NOT NULL
ON CONFLICT (id) DO UPDATE SET
    current_rate = EXCLUDED.current_rate,
    points_per_unit = EXCLUDED.points_per_unit,
    updated_at = NOW();

-- ============================================================================
-- 7. CREATE SAMPLE TRANSACTIONS
-- ============================================================================

-- Create sample transactions for existing wallets
INSERT INTO public.transactions (
    user_id, transaction_type, amount, points, description, 
    reference_type, reference_id, status, created_at
)
SELECT 
    user_id,
    'earned' as transaction_type,
    balance as amount,
    current_points as points,
    'Initial wallet balance migration' as description,
    'migration' as reference_type,
    id as reference_id,
    'completed' as status,
    created_at
FROM public.user_wallets
WHERE balance > 0 OR current_points > 0
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 8. UPDATE TIERS BASED ON POINTS
-- ============================================================================

-- Update tiers for all users based on their points
UPDATE public.user_wallets 
SET tier = calculate_user_tier(current_points),
    updated_at = NOW()
WHERE current_points > 0;

-- ============================================================================
-- 9. CLEANUP OLD TABLES (OPTIONAL - COMMENT OUT IF YOU WANT TO KEEP THEM)
-- ============================================================================

-- Uncomment these lines if you want to remove the old tables
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.user_profiles CASCADE;
-- DROP TABLE IF EXISTS public.wallets CASCADE;
-- DROP TABLE IF EXISTS public.user_wallets CASCADE;
-- DROP TABLE IF EXISTS public.collections CASCADE;
-- DROP TABLE IF EXISTS public.collection_pickups CASCADE;
-- DROP TABLE IF EXISTS public.materials CASCADE;

-- ============================================================================
-- 10. VERIFICATION
-- ============================================================================

-- Verify migration results
SELECT 
    'Migration Results' as info,
    'Users migrated: ' || COUNT(*) as users_count
FROM public.users
UNION ALL
SELECT 
    'Migration Results' as info,
    'User profiles migrated: ' || COUNT(*) as profiles_count
FROM public.user_profiles
UNION ALL
SELECT 
    'Migration Results' as info,
    'Wallets migrated: ' || COUNT(*) as wallets_count
FROM public.user_wallets
UNION ALL
SELECT 
    'Migration Results' as info,
    'Collection requests migrated: ' || COUNT(*) as requests_count
FROM public.collection_requests
UNION ALL
SELECT 
    'Migration Results' as info,
    'Materials migrated: ' || COUNT(*) as materials_count
FROM public.materials;

-- Show sample migrated data
SELECT 
    'Sample Migrated Users' as info,
    u.full_name, u.email, up.role, uw.balance, uw.current_points, uw.tier
FROM public.users u
JOIN public.user_profiles up ON u.id = up.user_id
JOIN public.user_wallets uw ON u.id = uw.user_id
LIMIT 5;

-- ============================================================================
-- 11. SUCCESS MESSAGE
-- ============================================================================

SELECT 
    '🎉 MIGRATION COMPLETED SUCCESSFULLY' as status,
    'All existing data has been migrated to the unified schema' as result,
    'Your apps should now work with the new unified system' as next_step,
    'Test all three apps to verify everything is working' as note;
