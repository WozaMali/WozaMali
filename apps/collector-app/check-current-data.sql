-- ============================================================================
-- CHECK CURRENT DATABASE DATA
-- ============================================================================
-- This script checks what data currently exists in your database
-- Run this to see what's available before applying fixes

-- 1. Check profiles table
SELECT 
    'PROFILES' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN role = 'customer' THEN 1 END) as customer_count,
    COUNT(CASE WHEN role = 'collector' THEN 1 END) as collector_count,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count
FROM profiles;

-- 2. Show sample profiles
SELECT 
    id,
    email,
    full_name,
    role,
    is_active,
    created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check addresses table
SELECT 
    'ADDRESSES' as table_name,
    COUNT(*) as total_records
FROM addresses;

-- 4. Show sample addresses
SELECT 
    id,
    profile_id,
    line1,
    suburb,
    city,
    is_primary
FROM addresses
LIMIT 5;

-- 5. Check pickups table
SELECT 
    'PICKUPS' as table_name,
    COUNT(*) as total_records
FROM pickups;

-- 6. Show pickups table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'pickups'
ORDER BY ordinal_position;

-- 7. Check pickup_items table
SELECT 
    'PICKUP_ITEMS' as table_name,
    COUNT(*) as total_records
FROM pickup_items;

-- 8. Check materials table
SELECT 
    'MATERIALS' as table_name,
    COUNT(*) as total_records
FROM materials;

-- 9. Show sample materials
SELECT 
    id,
    name,
    rate_per_kg,
    is_active
FROM materials
LIMIT 5;

-- 10. Check foreign key relationships
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('profiles', 'addresses', 'pickups')
ORDER BY tc.table_name, kcu.column_name;
