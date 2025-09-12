-- Fix function parameter names by dropping and recreating

-- Drop the existing function with old parameter name
DROP FUNCTION IF EXISTS process_collection_payment_main(UUID);

-- Recreate the function with correct parameter name
CREATE OR REPLACE FUNCTION process_collection_payment_main(
    p_pickup_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_pickup RECORD;
    v_total_value DECIMAL(10,2) := 0;
    v_total_points INTEGER := 0;
    v_material_value DECIMAL(10,2);
    v_material_points INTEGER;
    v_material_data RECORD;
    v_aluminium_value DECIMAL(10,2) := 0;
    v_pet_value DECIMAL(10,2) := 0;
    v_other_value DECIMAL(10,2) := 0;
    v_user_wallet_amount DECIMAL(10,2) := 0;
BEGIN
    -- Get pickup details
    SELECT p.* INTO v_pickup
    FROM pickups p
    WHERE p.id = p_pickup_id;
    
    IF v_pickup.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate value and points for each material in the pickup
    FOR v_material_data IN
        SELECT 
            pm.material_type,
            pm.kg as kilograms,
            pm.price_per_kg as rate_per_kg,
            pm.total_price,
            pm.points_per_kg,
            pm.total_points
        FROM pickup_materials pm
        WHERE pm.pickup_id = p_pickup_id
    LOOP
        -- Use existing calculated values from pickup_materials
        v_material_value := COALESCE(v_material_data.total_price, 0);
        v_total_value := v_total_value + v_material_value;
        
        -- Use existing calculated points from pickup_materials
        v_material_points := COALESCE(v_material_data.total_points, 0);
        v_total_points := v_total_points + v_material_points;
        
        -- Track values by material type for fund allocation
        IF v_material_data.material_type = 'Aluminium Cans' THEN
            v_aluminium_value := v_aluminium_value + v_material_value;
        ELSIF v_material_data.material_type = 'PET' THEN
            v_pet_value := v_pet_value + v_material_value;
        ELSE
            v_other_value := v_other_value + v_material_value;
        END IF;
    END LOOP;
    
    -- Calculate fund allocation:
    -- Aluminium: 100% to customer wallet
    -- PET: 100% to Green Scholar Fund (0% to customer)
    -- Other materials: 30% to customer wallet, 70% to Green Scholar Fund
    v_user_wallet_amount := v_aluminium_value + (v_other_value * 0.30);
    
    -- Update wallet with calculated amount and points
    PERFORM update_wallet_balance_main(
        v_pickup.customer_id,
        v_user_wallet_amount,
        v_total_points,
        'pickup',
        'Pickup payment for ' || v_pickup.id || ' - ' || v_total_value || ' total value'
    );
    
    -- Update pickup status to approved
    UPDATE pickups 
    SET 
        status = 'approved',
        total_value = v_total_value,
        total_points = v_total_points,
        updated_at = NOW()
    WHERE id = p_pickup_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_collection_payment_main TO authenticated;
