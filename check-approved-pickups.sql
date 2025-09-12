-- Check approved pickups in Office database

-- 1. Count all pickups by status
SELECT 
    status,
    COUNT(*) as count
FROM pickups 
GROUP BY status
ORDER BY count DESC;

-- 2. Count approved pickups specifically
SELECT 
    COUNT(*) as approved_pickups_count
FROM pickups 
WHERE status = 'approved';

-- 3. Show details of approved pickups
SELECT 
    id,
    customer_id,
    customer_name,
    status,
    total_kg,
    total_value,
    total_points,
    created_at
FROM pickups 
WHERE status = 'approved'
ORDER BY created_at DESC;

-- 4. Check pickup materials for approved pickups
SELECT 
    p.id as pickup_id,
    p.customer_name,
    p.status,
    pm.material_type,
    pm.kg,
    pm.total_price,
    pm.total_points
FROM pickups p
LEFT JOIN pickup_materials pm ON p.id = pm.pickup_id
WHERE p.status = 'approved'
ORDER BY p.created_at DESC, pm.material_type;
