-- ============================================================================
-- SIMPLIFIED WALLET INTEGRATION
-- ============================================================================
-- This script creates the necessary views for the Main App to read wallet data
-- It works with the existing table structure

-- ============================================================================
-- STEP 1: CREATE MAIN APP USER WALLET VIEW
-- ============================================================================
-- This view provides wallet data that the Main App can read directly
-- It uses the existing wallets table structure

CREATE OR REPLACE VIEW main_app_user_wallet AS
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
-- It uses placeholder data until collections are implemented

CREATE OR REPLACE VIEW user_collections_summary AS
SELECT 
  p.id as user_id,
  0 as total_collections,
  0 as total_weight,
  0 as total_money_value,
  0 as approved_collections,
  0 as pending_collections,
  'Not Available' as primary_material_type,
  0 as average_rate_per_kg
FROM profiles p;

-- ============================================================================
-- STEP 3: ENSURE WALLETS TABLE EXISTS
-- ============================================================================
-- Create wallets table if it doesn't exist

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_points INTEGER DEFAULT 0,
  tier VARCHAR(20) DEFAULT 'bronze',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_tier ON wallets(tier);

-- ============================================================================
-- STEP 5: GRANT PERMISSIONS
-- ============================================================================
-- Ensure the Main App can read from these views

GRANT SELECT ON main_app_user_wallet TO authenticated;
GRANT SELECT ON user_collections_summary TO authenticated;
GRANT SELECT ON wallets TO authenticated;

-- ============================================================================
-- STEP 6: CREATE DEFAULT WALLETS FOR EXISTING USERS
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
WHERE w.user_id IS NULL;

-- ============================================================================
-- INTEGRATION COMPLETE
-- ============================================================================
-- The Main App can now read wallet data from the views created above
-- When collections are implemented, these views can be updated to include
-- real collection data from the Office/Admin app
