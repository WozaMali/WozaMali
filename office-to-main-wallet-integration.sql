-- ============================================================================
-- OFFICE/ADMIN APP TO MAIN APP WALLET INTEGRATION
-- ============================================================================
-- This script ensures the Main App reads wallet data that the Office/Admin App
-- calculates and updates when approving pickups

-- ============================================================================
-- STEP 1: CREATE MAIN APP USER WALLET VIEW
-- ============================================================================
-- This view reads the wallet data that the Office/Admin App updates
-- It uses the existing wallets table that gets updated by Office/Admin triggers

DROP VIEW IF EXISTS main_app_user_wallet;
CREATE VIEW main_app_user_wallet AS
SELECT 
  p.id as user_id,
  COALESCE(w.balance, 0) as current_balance,      -- FROM Office/Admin updated wallets.balance
  COALESCE(w.total_points, 0) as total_points,    -- FROM Office/Admin updated wallets.total_points
  COALESCE(w.tier, 'Bronze Recycler') as current_tier, -- FROM Office/Admin updated wallets.tier
  COALESCE(w.balance, 0) as total_earned,         -- Same as balance (total earned from pickups)
  COALESCE(w.total_points, 0) as total_weight_kg, -- Points = weight in kg
  0 as total_pickups, -- Will be calculated from pickups table
  w.created_at,
  w.updated_at
FROM profiles p
LEFT JOIN wallets w ON p.id = w.user_id;

-- ============================================================================
-- STEP 2: CREATE USER COLLECTIONS SUMMARY VIEW
-- ============================================================================
-- This view reads collection data that the Office/Admin App manages
-- It shows the user's pickup history and statistics

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
-- STEP 4: CREATE TRIGGER TO UPDATE WALLETS WHEN PICKUPS ARE APPROVED
-- ============================================================================
-- This trigger ensures that when Office/Admin approves a pickup, the wallet is updated
-- This is the same logic from the Office/Admin App

CREATE OR REPLACE FUNCTION public.update_wallet_on_pickup_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_wallet_id UUID;
  v_pickup_total DECIMAL(10,2);
  v_wallet_amount DECIMAL(10,2);
  v_total_weight DECIMAL(10,2);
  v_current_points INTEGER;
  v_new_total_points INTEGER;
  v_tier TEXT;
BEGIN
  -- Only proceed if pickup status changed to 'approved'
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    
    -- Calculate pickup total value and total weight from pickup_items
    SELECT 
      COALESCE(SUM(pi.kilograms * m.rate_per_kg), 0),
      COALESCE(SUM(pi.kilograms), 0)
    INTO 
      v_pickup_total,
      v_total_weight
    FROM public.pickup_items pi
    JOIN public.materials m ON pi.material_id = m.id
    WHERE pi.pickup_id = NEW.id;
    
    -- Calculate wallet amount (30% of pickup total)
    v_wallet_amount := ROUND(v_pickup_total * 0.3, 2);
    
    -- Points are equal to total weight (as per Office/Admin logic)
    v_new_total_points := v_total_weight::INTEGER;
    
    -- Get or create wallet for the customer
    SELECT id, total_points INTO v_wallet_id, v_current_points
    FROM public.wallets
    WHERE user_id = NEW.customer_id;
    
    -- If wallet doesn't exist, create it
    IF v_wallet_id IS NULL THEN
      INSERT INTO public.wallets (user_id, balance, total_points, tier, created_at, updated_at)
      VALUES (NEW.customer_id, v_wallet_amount, v_new_total_points, 'Bronze Recycler', NOW(), NOW())
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
      WHEN (v_current_points + v_new_total_points) >= 1000 THEN 'Diamond Recycler'
      WHEN (v_current_points + v_new_total_points) >= 500 THEN 'Platinum Recycler'
      WHEN (v_current_points + v_new_total_points) >= 250 THEN 'Gold Recycler'
      WHEN (v_current_points + v_new_total_points) >= 100 THEN 'Silver Recycler'
      ELSE 'Bronze Recycler'
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
      NEW.customer_id,
      'wallet_credit',
      'Wallet credited from approved pickup',
      jsonb_build_object(
        'pickup_id', NEW.id,
        'amount_credited', v_wallet_amount,
        'points_credited', v_new_total_points,
        'pickup_total_value', v_pickup_total,
        'pickup_total_weight', v_total_weight,
        'wallet_id', v_wallet_id,
        'new_tier', v_tier
      )
    );
    
    RAISE NOTICE 'Wallet updated for user %: +R% (points: %)', 
      NEW.customer_id, v_wallet_amount, v_new_total_points;
  END IF;
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 5: CREATE TRIGGER ON PICKUPS TABLE
-- ============================================================================
-- Attach the function to the pickups table

DROP TRIGGER IF EXISTS trg_update_wallet_on_pickup_approval ON public.pickups;
CREATE TRIGGER trg_update_wallet_on_pickup_approval
AFTER UPDATE OF status ON public.pickups
FOR EACH ROW
EXECUTE FUNCTION public.update_wallet_on_pickup_approval();

-- ============================================================================
-- STEP 6: GRANT PERMISSIONS
-- ============================================================================
-- Ensure the Main App can read from these views

GRANT SELECT ON main_app_user_wallet TO authenticated;
GRANT SELECT ON user_collections_summary TO authenticated;
GRANT SELECT ON wallets TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_wallet_on_pickup_approval() TO authenticated;

-- ============================================================================
-- STEP 7: CREATE DEFAULT WALLETS FOR EXISTING USERS
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
-- DATA FLOW:
-- 1. Office/Admin App approves pickup → Updates pickups.status = 'approved'
-- 2. Trigger fires → Updates wallets.balance, wallets.total_points, wallets.tier
-- 3. Main App reads from main_app_user_wallet view → Shows updated wallet data
-- 
-- The Main App will now automatically show the wallet balance, points, and tier
-- that the Office/Admin App calculates and updates when approving pickups.
