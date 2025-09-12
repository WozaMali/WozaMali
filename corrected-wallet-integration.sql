-- ============================================================================
-- CORRECTED WALLET INTEGRATION
-- ============================================================================
-- This script creates the necessary views for the Main App to read wallet data
-- It works with the EXISTING table structure

-- ============================================================================
-- STEP 1: CREATE MAIN APP USER WALLET VIEW
-- ============================================================================
-- This view provides wallet data that the Main App can read directly
-- It uses the existing wallets table structure

DROP VIEW IF EXISTS main_app_user_wallet;
CREATE VIEW main_app_user_wallet AS
SELECT 
  p.id as user_id,
  COALESCE(w.balance, 0) as current_balance,
  COALESCE(w.total_points, 0) as total_points,
  COALESCE(w.tier, 'bronze') as current_tier,
  COALESCE(w.balance, 0) as total_earned,
  COALESCE(w.total_points, 0) as total_weight_kg,
  0 as total_pickups, -- Will be updated when collections are implemented
  w.created_at,
  w.updated_at
FROM profiles p
LEFT JOIN wallets w ON p.id = w.user_id;

-- ============================================================================
-- STEP 2: CREATE USER COLLECTIONS SUMMARY VIEW
-- ============================================================================
-- This view provides collection data that the Main App can read directly
-- It uses the existing pickups and pickup_items tables

DROP VIEW IF EXISTS user_collections_summary;
CREATE VIEW user_collections_summary AS
SELECT 
  p.id as user_id,
  COALESCE(COUNT(DISTINCT pk.id), 0) as total_collections,
  COALESCE(SUM(pi.kilograms), 0) as total_weight,
  COALESCE(SUM(pi.kilograms * m.rate_per_kg), 0) as total_money_value,
  COALESCE(COUNT(DISTINCT CASE WHEN pk.status = 'approved' THEN pk.id END), 0) as approved_collections,
  COALESCE(COUNT(DISTINCT CASE WHEN pk.status = 'pending' THEN pk.id END), 0) as pending_collections,
  COALESCE(
    (SELECT m2.type 
     FROM pickup_items pi2 
     JOIN materials m2 ON pi2.material_id = m2.id 
     WHERE pi2.pickup_id = pk.id 
     GROUP BY m2.type 
     ORDER BY SUM(pi2.kilograms) DESC 
     LIMIT 1), 
    'Not Available'
  ) as primary_material_type,
  COALESCE(AVG(m.rate_per_kg), 0) as average_rate_per_kg
FROM profiles p
LEFT JOIN pickups pk ON p.id = pk.customer_id
LEFT JOIN pickup_items pi ON pk.id = pi.pickup_id
LEFT JOIN materials m ON pi.material_id = m.id
GROUP BY p.id;

-- ============================================================================
-- STEP 3: GRANT PERMISSIONS
-- ============================================================================
-- Ensure the Main App can read from these views

GRANT SELECT ON main_app_user_wallet TO authenticated;
GRANT SELECT ON user_collections_summary TO authenticated;

-- ============================================================================
-- STEP 4: CREATE DEFAULT WALLETS FOR EXISTING USERS
-- ============================================================================
-- Create default wallets for users who don't have one

INSERT INTO wallets (user_id, balance, total_points, tier)
SELECT 
  p.id,
  0.00,
  0,
  'bronze'
FROM profiles p
LEFT JOIN wallets w ON p.id = w.user_id
WHERE w.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- INTEGRATION COMPLETE
-- ============================================================================
-- The Main App can now read wallet data from the views created above
-- These views will automatically update when pickups are approved in the Office/Admin app
