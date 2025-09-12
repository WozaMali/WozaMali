-- ============================================================================
-- UNIFIED WALLET INTEGRATION
-- ============================================================================
-- This script ensures the Main App reads wallet data from the same source
-- that the Office/Admin app uses to create money/wallet/value for members

-- ============================================================================
-- STEP 1: CREATE UNIFIED WALLET VIEW FOR MAIN APP
-- ============================================================================
-- This view provides wallet data that the Main App can read directly
-- It calculates wallet balance from approved pickups (same as Office App)

CREATE OR REPLACE VIEW main_app_user_wallet AS
SELECT 
  p.id as user_id,
  COALESCE(w.balance, 0) as current_balance,
  COALESCE(w.total_points, 0) as total_points,
  COALESCE(w.tier, 'bronze') as current_tier,
  -- Calculate total earned from approved pickups (same as Office App)
  COALESCE((
    SELECT ROUND(SUM(pi.kilograms * m.rate_per_kg * 0.3), 2)
    FROM pickups pk
    JOIN pickup_items pi ON pk.id = pi.pickup_id
    JOIN materials m ON pi.material_id = m.id
    WHERE pk.user_id = p.id 
      AND pk.status = 'approved'
  ), 0) as total_earned,
  -- Calculate total weight from approved pickups
  COALESCE((
    SELECT SUM(pi.kilograms)
    FROM pickups pk
    JOIN pickup_items pi ON pk.id = pi.pickup_id
    WHERE pk.user_id = p.id 
      AND pk.status = 'approved'
  ), 0) as total_weight_kg,
  -- Calculate total pickups
  COALESCE((
    SELECT COUNT(*)
    FROM pickups pk
    WHERE pk.user_id = p.id 
      AND pk.status = 'approved'
  ), 0) as total_pickups,
  w.created_at,
  w.updated_at
FROM profiles p
LEFT JOIN wallets w ON p.id = w.user_id;

-- ============================================================================
-- STEP 2: CREATE UNIFIED COLLECTIONS SUMMARY VIEW
-- ============================================================================
-- This view provides collection data that the Main App can read directly
-- It shows approved pickups and their values (same as Office App)

CREATE OR REPLACE VIEW user_collections_summary AS
SELECT 
  p.id as user_id,
  -- Total collections (approved only)
  COALESCE((
    SELECT COUNT(*)
    FROM pickups pk
    WHERE pk.user_id = p.id 
      AND pk.status = 'approved'
  ), 0) as total_collections,
  -- Total weight from approved pickups
  COALESCE((
    SELECT SUM(pi.kilograms)
    FROM pickups pk
    JOIN pickup_items pi ON pk.id = pi.pickup_id
    WHERE pk.user_id = p.id 
      AND pk.status = 'approved'
  ), 0) as total_weight,
  -- Total money value (30% of pickup value)
  COALESCE((
    SELECT ROUND(SUM(pi.kilograms * m.rate_per_kg * 0.3), 2)
    FROM pickups pk
    JOIN pickup_items pi ON pk.id = pi.pickup_id
    JOIN materials m ON pi.material_id = m.id
    WHERE pk.user_id = p.id 
      AND pk.status = 'approved'
  ), 0) as total_money_value,
  -- Approved collections count
  COALESCE((
    SELECT COUNT(*)
    FROM pickups pk
    WHERE pk.user_id = p.id 
      AND pk.status = 'approved'
  ), 0) as approved_collections,
  -- Pending collections count
  COALESCE((
    SELECT COUNT(*)
    FROM pickups pk
    WHERE pk.user_id = p.id 
      AND pk.status = 'pending'
  ), 0) as pending_collections,
  -- Primary material type
  (
    SELECT m.material_name
    FROM pickups pk
    JOIN pickup_items pi ON pk.id = pi.pickup_id
    JOIN materials m ON pi.material_id = m.id
    WHERE pk.user_id = p.id 
      AND pk.status = 'approved'
    GROUP BY m.material_name
    ORDER BY SUM(pi.kilograms) DESC
    LIMIT 1
  ) as primary_material_type,
  -- Average rate per kg
  COALESCE((
    SELECT ROUND(AVG(m.rate_per_kg), 2)
    FROM pickups pk
    JOIN pickup_items pi ON pk.id = pi.pickup_id
    JOIN materials m ON pi.material_id = m.id
    WHERE pk.user_id = p.id 
      AND pk.status = 'approved'
  ), 0) as average_rate_per_kg
FROM profiles p;

-- ============================================================================
-- STEP 3: ENSURE WALLET TABLE IS UPDATED WHEN PICKUPS ARE APPROVED
-- ============================================================================
-- This trigger ensures that when a pickup is approved in the Office App,
-- the wallet balance is updated immediately for the Main App to read

CREATE OR REPLACE FUNCTION update_wallet_on_pickup_approval()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_pickup_total DECIMAL(10,2);
  v_wallet_amount DECIMAL(10,2);
  v_total_weight DECIMAL(10,2);
  v_total_points INTEGER;
BEGIN
  -- Only proceed if pickup status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    v_user_id := NEW.user_id;
    
    -- Calculate pickup total from pickup_items (same as Office App)
    SELECT COALESCE(SUM(pi.kilograms * m.rate_per_kg), 0)
    INTO v_pickup_total
    FROM pickup_items pi
    JOIN materials m ON pi.material_id = m.id
    WHERE pi.pickup_id = NEW.id;
    
    -- Calculate wallet amount (30% of pickup total)
    v_wallet_amount := ROUND(v_pickup_total * 0.3, 2);
    
    -- Calculate total weight for points
    SELECT COALESCE(SUM(pi.kilograms), 0)
    INTO v_total_weight
    FROM pickup_items pi
    WHERE pi.pickup_id = NEW.id;
    
    -- Points = Total Weight (as per user requirement)
    v_total_points := v_total_weight::INTEGER;
    
    -- Update or create wallet
    INSERT INTO wallets (user_id, balance, total_points, tier, created_at, updated_at)
    VALUES (
      v_user_id, 
      v_wallet_amount, 
      v_total_points, 
      CASE 
        WHEN v_total_points >= 1000 THEN 'platinum'
        WHEN v_total_points >= 500 THEN 'gold'
        WHEN v_total_points >= 100 THEN 'silver'
        ELSE 'bronze'
      END,
      NOW(), 
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      balance = wallets.balance + v_wallet_amount,
      total_points = wallets.total_points + v_total_points,
      tier = CASE 
        WHEN (wallets.total_points + v_total_points) >= 1000 THEN 'platinum'
        WHEN (wallets.total_points + v_total_points) >= 500 THEN 'gold'
        WHEN (wallets.total_points + v_total_points) >= 100 THEN 'silver'
        ELSE 'bronze'
      END,
      updated_at = NOW();
    
    RAISE NOTICE 'Wallet updated for user %: +R% (pickup total: R%, weight: %kg)', 
      v_user_id, v_wallet_amount, v_pickup_total, v_total_weight;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update wallets when pickups are approved
DROP TRIGGER IF EXISTS trigger_update_wallet_on_pickup_approval ON pickups;
CREATE TRIGGER trigger_update_wallet_on_pickup_approval
  AFTER UPDATE ON pickups
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_on_pickup_approval();

-- ============================================================================
-- STEP 4: GRANT PERMISSIONS
-- ============================================================================
-- Ensure the Main App can read from these views

GRANT SELECT ON main_app_user_wallet TO authenticated;
GRANT SELECT ON user_collections_summary TO authenticated;

-- ============================================================================
-- STEP 5: BACKFILL EXISTING DATA
-- ============================================================================
-- Update existing wallets with data from approved pickups

DO $$
DECLARE
  v_user_id UUID;
  v_pickup_total DECIMAL(10,2);
  v_wallet_amount DECIMAL(10,2);
  v_total_weight DECIMAL(10,2);
  v_total_points INTEGER;
BEGIN
  -- Loop through all users with approved pickups
  FOR v_user_id IN 
    SELECT DISTINCT p.user_id
    FROM pickups p
    WHERE p.status = 'approved'
      AND p.user_id IS NOT NULL
  LOOP
    -- Calculate total value from approved pickups for this user
    SELECT COALESCE(SUM(pi.kilograms * m.rate_per_kg), 0)
    INTO v_pickup_total
    FROM pickups pk
    JOIN pickup_items pi ON pk.id = pi.pickup_id
    JOIN materials m ON pi.material_id = m.id
    WHERE pk.user_id = v_user_id
      AND pk.status = 'approved';
    
    -- Calculate wallet amount (30% of total approved value)
    v_wallet_amount := ROUND(v_pickup_total * 0.3, 2);
    
    -- Calculate total weight for points
    SELECT COALESCE(SUM(pi.kilograms), 0)
    INTO v_total_weight
    FROM pickups pk
    JOIN pickup_items pi ON pk.id = pi.pickup_id
    WHERE pk.user_id = v_user_id
      AND pk.status = 'approved';
    
    -- Points = Total Weight
    v_total_points := v_total_weight::INTEGER;
    
    -- Update or create wallet
    INSERT INTO wallets (user_id, balance, total_points, tier, created_at, updated_at)
    VALUES (
      v_user_id, 
      v_wallet_amount, 
      v_total_points, 
      CASE 
        WHEN v_total_points >= 1000 THEN 'platinum'
        WHEN v_total_points >= 500 THEN 'gold'
        WHEN v_total_points >= 100 THEN 'silver'
        ELSE 'bronze'
      END,
      NOW(), 
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      balance = v_wallet_amount,
      total_points = v_total_points,
      tier = CASE 
        WHEN v_total_points >= 1000 THEN 'platinum'
        WHEN v_total_points >= 500 THEN 'gold'
        WHEN v_total_points >= 100 THEN 'silver'
        ELSE 'bronze'
      END,
      updated_at = NOW();
    
    RAISE NOTICE 'Backfilled wallet for user %: R% (total approved: R%, weight: %kg)', 
      v_user_id, v_wallet_amount, v_pickup_total, v_total_weight;
  END LOOP;
END $$;

-- ============================================================================
-- INTEGRATION COMPLETE
-- ============================================================================
-- The Main App will now read wallet data from the same source as the Office App
-- When pickups are approved in the Office App, wallet balances are updated immediately
-- The Main App can read current wallet data from the views created above
