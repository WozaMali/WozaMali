-- ============================================================================
-- CLEANUP RECENT TEST DATA (SAFER VERSION)
-- ============================================================================
-- This script removes recent test data (last 7 days) which is safer
-- It focuses on data that was likely created during testing

-- Step 1: Check what we're about to delete (run this first to review)
-- ============================================================================

-- Show recent test collections
SELECT 
    'Recent test collections to be deleted' as info,
    id,
    user_id,
    material_type,
    kgs,
    status,
    notes,
    admin_notes,
    created_at
FROM collections 
WHERE created_at > NOW() - INTERVAL '7 days'
AND (notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR material_type ILIKE '%test%')
ORDER BY created_at DESC;

-- Show recent test unified collections
SELECT 
    'Recent test unified_collections to be deleted' as info,
    id,
    collection_code,
    customer_name,
    status,
    customer_notes,
    collector_notes,
    admin_notes,
    created_at
FROM unified_collections 
WHERE created_at > NOW() - INTERVAL '7 days'
AND (customer_notes ILIKE '%test%' OR collector_notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR customer_name ILIKE '%test%')
ORDER BY created_at DESC;

-- Show recent test wallet transactions
SELECT 
    'Recent test wallet_transactions to be deleted' as info,
    id,
    wallet_id,
    transaction_type,
    points,
    description,
    source_type,
    created_at
FROM wallet_transactions 
WHERE created_at > NOW() - INTERVAL '7 days'
AND (description ILIKE '%test%' OR source_type ILIKE '%test%')
ORDER BY created_at DESC;

-- Step 2: Delete recent test data (uncomment to execute)
-- ============================================================================

-- Uncomment the following lines to actually delete the data
-- WARNING: This will permanently delete the data!

/*
-- Delete recent test collections and related data
WITH test_collection_ids AS (
    SELECT id FROM collections 
    WHERE created_at > NOW() - INTERVAL '7 days'
    AND (notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR material_type ILIKE '%test%')
)
DELETE FROM collection_photos 
WHERE collection_id IN (SELECT id FROM test_collection_ids);

WITH test_collection_ids AS (
    SELECT id FROM collections 
    WHERE created_at > NOW() - INTERVAL '7 days'
    AND (notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR material_type ILIKE '%test%')
)
DELETE FROM collection_materials 
WHERE collection_id IN (SELECT id FROM test_collection_ids);

WITH test_collection_ids AS (
    SELECT id FROM collections 
    WHERE created_at > NOW() - INTERVAL '7 days'
    AND (notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR material_type ILIKE '%test%')
)
DELETE FROM wallet_update_queue 
WHERE collection_id IN (SELECT id FROM test_collection_ids);

WITH test_collection_ids AS (
    SELECT id FROM collections 
    WHERE created_at > NOW() - INTERVAL '7 days'
    AND (notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR material_type ILIKE '%test%')
)
DELETE FROM wallet_transactions 
WHERE source_id IN (SELECT id FROM test_collection_ids);

WITH test_collection_ids AS (
    SELECT id FROM collections 
    WHERE created_at > NOW() - INTERVAL '7 days'
    AND (notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR material_type ILIKE '%test%')
)
DELETE FROM transactions 
WHERE source_id IN (SELECT id FROM test_collection_ids);

-- Delete recent test collections
DELETE FROM collections 
WHERE created_at > NOW() - INTERVAL '7 days'
AND (notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR material_type ILIKE '%test%');

-- Delete recent test unified collections and related data
WITH test_unified_collection_ids AS (
    SELECT id FROM unified_collections 
    WHERE created_at > NOW() - INTERVAL '7 days'
    AND (customer_notes ILIKE '%test%' OR collector_notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR customer_name ILIKE '%test%')
)
DELETE FROM collection_photos 
WHERE collection_id IN (SELECT id FROM test_unified_collection_ids);

WITH test_unified_collection_ids AS (
    SELECT id FROM unified_collections 
    WHERE created_at > NOW() - INTERVAL '7 days'
    AND (customer_notes ILIKE '%test%' OR collector_notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR customer_name ILIKE '%test%')
)
DELETE FROM collection_materials 
WHERE collection_id IN (SELECT id FROM test_unified_collection_ids);

WITH test_unified_collection_ids AS (
    SELECT id FROM unified_collections 
    WHERE created_at > NOW() - INTERVAL '7 days'
    AND (customer_notes ILIKE '%test%' OR collector_notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR customer_name ILIKE '%test%')
)
DELETE FROM wallet_update_queue 
WHERE collection_id IN (SELECT id FROM test_unified_collection_ids);

WITH test_unified_collection_ids AS (
    SELECT id FROM unified_collections 
    WHERE created_at > NOW() - INTERVAL '7 days'
    AND (customer_notes ILIKE '%test%' OR collector_notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR customer_name ILIKE '%test%')
)
DELETE FROM wallet_transactions 
WHERE source_id IN (SELECT id FROM test_unified_collection_ids);

WITH test_unified_collection_ids AS (
    SELECT id FROM unified_collections 
    WHERE created_at > NOW() - INTERVAL '7 days'
    AND (customer_notes ILIKE '%test%' OR collector_notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR customer_name ILIKE '%test%')
)
DELETE FROM transactions 
WHERE source_id IN (SELECT id FROM test_unified_collection_ids);

-- Delete recent test unified collections
DELETE FROM unified_collections 
WHERE created_at > NOW() - INTERVAL '7 days'
AND (customer_notes ILIKE '%test%' OR collector_notes ILIKE '%test%' OR admin_notes ILIKE '%test%' OR customer_name ILIKE '%test%');

-- Delete recent test wallet transactions
DELETE FROM wallet_transactions 
WHERE created_at > NOW() - INTERVAL '7 days'
AND (description ILIKE '%test%' OR source_type ILIKE '%test%');

-- Delete recent test transactions
DELETE FROM transactions 
WHERE created_at > NOW() - INTERVAL '7 days'
AND (description ILIKE '%test%' OR reference ILIKE '%test%');
*/

-- Step 3: Show final counts after cleanup
-- ============================================================================

SELECT 'Final counts after cleanup' as info;
SELECT 'collections' as table_name, COUNT(*) as remaining_records FROM collections;
SELECT 'unified_collections' as table_name, COUNT(*) as remaining_records FROM unified_collections;
SELECT 'wallet_transactions' as table_name, COUNT(*) as remaining_records FROM wallet_transactions;
SELECT 'transactions' as table_name, COUNT(*) as remaining_records FROM transactions;
