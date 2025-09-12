-- ============================================================================
-- FIXED WALLET INTEGRATION - CORRECTED SQL
-- ============================================================================
-- This script fixes the SQL grouping error in the user_collections_summary view

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
  COALESCE(w.tier, 'bronze') as current_tier,     -- FROM Office/Admin updated wallets.tier
  COALESCE(w.balance, 0) as total_earned,         -- Same as balance (total earned from pickups)
  COALESCE(w.total_points, 0) as total_weight_kg, -- Points = weight in kg
  0 as total_pickups, -- Will be calculated from collections table
  w.created_at,
  w.updated_at
FROM profiles p
LEFT JOIN wallets w ON p.id = w.user_id;

-- ============================================================================
-- STEP 2: CREATE USER COLLECTIONS SUMMARY VIEW (FIXED)
-- ============================================================================
-- This view reads collection data from the ACTUAL Office App tables
-- Fixed the SQL grouping error

DROP VIEW IF EXISTS user_collections_summary;
CREATE VIEW user_collections_summary AS
SELECT 
  p.id as user_id,
  COALESCE(COUNT(DISTINCT c.id), 0) as total_collections,
  COALESCE(SUM(pi.quantity), 0) as total_weight,
  COALESCE(SUM(pi.total_price), 0) as total_money_value,
  COALESCE(COUNT(DISTINCT CASE WHEN c.status = 'approved' THEN c.id END), 0) as approved_collections,
  COALESCE(COUNT(DISTINCT CASE WHEN c.status = 'pending' THEN c.id END), 0) as pending_collections,
  COALESCE(
    (SELECT m.name 
     FROM pickup_items pi2 
     JOIN materials m ON pi2.material_id = m.id 
     JOIN collections c2 ON pi2.pickup_id = c2.id
     WHERE c2.user_id = p.id 
     GROUP BY m.name 
     ORDER BY SUM(pi2.quantity) DESC 
     LIMIT 1), 
    'Not Available'
  ) as primary_material_type,
  COALESCE(AVG(m.current_price_per_unit), 0) as average_rate_per_kg
FROM profiles p
LEFT JOIN collections c ON p.id = c.user_id
LEFT JOIN pickup_items pi ON c.id = pi.pickup_id
LEFT JOIN materials m ON pi.material_id = m.id
GROUP BY p.id;

-- ============================================================================
-- STEP 3: CREATE TRIGGER TO UPDATE WALLETS WHEN COLLECTIONS ARE APPROVED
-- ============================================================================
-- This trigger ensures that when Office/Admin approves a collection, the wallet is updated
-- It uses the ACTUAL collections table structure

CREATE OR REPLACE FUNCTION public.update_wallet_on_collection_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_collection_total DECIMAL(10,2);
  v_wallet_amount DECIMAL(10,2);
  v_total_weight DECIMAL(10,2);
  v_current_points INTEGER;
  v_new_total_points INTEGER;
  v_tier TEXT;
BEGIN
  -- Only proceed if collection status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Calculate collection total value and total weight from pickup_items
    SELECT 
      COALESCE(SUM(pi.total_price), 0),
      COALESCE(SUM(pi.quantity), 0)
    INTO 
      v_collection_total,
      v_total_weight
    FROM public.pickup_items pi
    WHERE pi.pickup_id = NEW.id;
    
    -- Calculate wallet amount (30% of collection total)
    v_wallet_amount := ROUND(v_collection_total * 0.3, 2);
    
    -- Points are equal to total weight (as per Office/Admin logic)
    v_new_total_points := v_total_weight::INTEGER;
    
    -- Get or create wallet for the customer
    SELECT id, total_points INTO v_wallet_id, v_current_points
    FROM public.wallets
    WHERE user_id = NEW.user_id;
    
    -- If wallet doesn't exist, create it
    IF v_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, balance, total_points, tier, created_at, updated_at)
      VALUES (NEW.user_id, v_wallet_amount, v_new_total_points, 'bronze', NOW(), NOW())
      RETURNING id, tier INTO v_wallet_id, v_tier;
    ELSE
      -- Update existing wallet balance and points
      UPDATE public.wallets
      SET 
        balance = balance + v_wallet_amount,
        total_points = total_points + v_new_total_points,
        updated_at = NOW()
      WHERE id = v_wallet_id
      RETURNING tier INTO v_tier;
    END IF;
    
    -- Recalculate tier based on new total_points
    SELECT CASE
      WHEN (v_current_points + v_new_total_points) >= 1000 THEN 'platinum'
      WHEN (v_current_points + v_new_total_points) >= 500 THEN 'gold'
      WHEN (v_current_points + v_new_total_points) >= 250 THEN 'silver'
      WHEN (v_current_points + v_new_total_points) >= 100 THEN 'bronze'
      ELSE 'bronze'
    END INTO v_tier;
    
    UPDATE public.wallets
    SET tier = v_tier
    WHERE id = v_wallet_id;
    
    -- Log the wallet update
    INSERT INTO public.user_activity_log (
      user_id,
      activity_type,
      description,
      metadata
    ) VALUES (
      NEW.user_id,
      'wallet_credit',
      'Wallet credited from approved collection',
      jsonb_build_object(
        'collection_id', NEW.id,
        'amount_credited', v_wallet_amount,
        'points_credited', v_new_total_points,
        'collection_total_value', v_collection_total,
        'collection_total_weight', v_total_weight,
        'wallet_id', v_wallet_id,
        'new_tier', v_tier
      )
    );
    
    RAISE NOTICE 'Wallet updated for user %: +R% (points: %)', 
      NEW.user_id, v_wallet_amount, v_new_total_points;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 4: CREATE TRIGGER ON COLLECTIONS TABLE
-- ============================================================================
-- Attach the function to the collections table

DROP TRIGGER IF EXISTS trg_update_wallet_on_collection_approval ON public.collections;
CREATE TRIGGER trg_update_wallet_on_collection_approval
AFTER UPDATE OF status ON public.collections
FOR EACH ROW
EXECUTE FUNCTION public.update_wallet_on_collection_approval();

-- ============================================================================
-- STEP 5: GRANT PERMISSIONS
-- ============================================================================
-- Ensure the Main App can read from these views

GRANT SELECT ON main_app_user_wallet TO authenticated;
GRANT SELECT ON user_collections_summary TO authenticated;
GRANT SELECT ON wallets TO authenticated;
GRANT SELECT ON collections TO authenticated;
GRANT SELECT ON pickup_items TO authenticated;
GRANT SELECT ON materials TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_wallet_on_collection_approval() TO authenticated;

-- ============================================================================
-- INTEGRATION COMPLETE
-- ============================================================================
-- 
-- DATA FLOW:
-- 1. Office/Admin App approves collection → Updates collections.status = 'approved'
-- 2. Trigger fires → Updates wallets.balance, wallets.total_points, wallets.tier
-- 3. Main App reads from main_app_user_wallet view → Shows updated wallet data
-- 
-- The Main App will now automatically show the wallet balance, points, and tier
-- that the Office/Admin App calculates and updates when approving collections.
