-- ============================================================================
-- SIMPLE WALLET INTEGRATION
-- ============================================================================
-- This script creates the necessary views for the Main App to read wallet data
-- It works with the existing wallets table and doesn't depend on pickups table

-- ============================================================================
-- STEP 1: CREATE MAIN APP USER WALLET VIEW
-- ============================================================================
-- This view reads the wallet data that the Office/Admin App updates
-- It uses the existing wallets table structure

DROP VIEW IF EXISTS main_app_user_wallet;
CREATE VIEW main_app_user_wallet AS
SELECT 
  p.id as user_id,
  COALESCE(w.balance, 0) as current_balance,      -- FROM Office/Admin updated wallets.balance
  COALESCE(w.total_points, 0) as total_points,    -- FROM Office/Admin updated wallets.total_points
  COALESCE(w.tier, 'Bronze Recycler') as current_tier, -- FROM Office/Admin updated wallets.tier
  COALESCE(w.balance, 0) as total_earned,         -- Same as balance (total earned from pickups)
  COALESCE(w.total_points, 0) as total_weight_kg, -- Points = weight in kg
  0 as total_pickups, -- Will be calculated when pickups table is available
  w.created_at,
  w.updated_at
FROM profiles p
LEFT JOIN wallets w ON p.id = w.user_id;

-- ============================================================================
-- STEP 2: CREATE USER COLLECTIONS SUMMARY VIEW
-- ============================================================================
-- This view provides placeholder collection data
-- It will be updated when the pickups table structure is confirmed

DROP VIEW IF EXISTS user_collections_summary;
CREATE VIEW user_collections_summary AS
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
-- STEP 3: ENSURE WALLETS TABLE EXISTS WITH CORRECT STRUCTURE
-- ============================================================================
-- Make sure the wallets table has the structure the Office/Admin App expects

CREATE TABLE IF NOT EXISTS wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) DEFAULT 0.00,
  total_points INTEGER DEFAULT 0,
  tier VARCHAR(50) DEFAULT 'Bronze Recycler',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: GRANT PERMISSIONS
-- ============================================================================
-- Ensure the Main App can read from these views

GRANT SELECT ON main_app_user_wallet TO authenticated;
GRANT SELECT ON user_collections_summary TO authenticated;
GRANT SELECT ON wallets TO authenticated;

-- ============================================================================
-- STEP 5: CREATE DEFAULT WALLETS FOR EXISTING USERS
-- ============================================================================
-- Create default wallets for users who don't have one

INSERT INTO wallets (user_id, balance, total_points, tier)
SELECT 
  p.id,
  0.00,
  0,
  'Bronze Recycler'
FROM profiles p
LEFT JOIN wallets w ON p.id = w.user_id
WHERE w.user_id IS NULL
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- INTEGRATION COMPLETE
-- ============================================================================
-- 
-- This creates the basic wallet integration that works with the existing structure.
-- Once we confirm the pickups table structure, we can add the trigger and
-- update the collections summary view.
