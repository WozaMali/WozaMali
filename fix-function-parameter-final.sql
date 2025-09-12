-- Fix function parameter names by dropping and recreating

-- Drop the existing function with old parameter name
DROP FUNCTION IF EXISTS process_collection_payment_main(UUID);

-- Recreate the function with correct parameter name
CREATE OR REPLACE FUNCTION process_collection_payment_main(
    p_collection_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_collection RECORD;
    v_total_value DECIMAL(10,2) := 0;
    v_total_points INTEGER := 0;
    v_user_wallet_amount DECIMAL(10,2) := 0;
BEGIN
    -- Get collection details from unified_collections
    SELECT uc.* INTO v_collection
    FROM unified_collections uc
    WHERE uc.id = p_collection_id;
    
    IF v_collection.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Use existing calculated values from unified_collections
    v_total_value := COALESCE(v_collection.total_value, 0);
    
    -- For now, use a simple points calculation (1 point per R1)
    v_total_points := FLOOR(v_total_value);
    
    -- Calculate fund allocation based on material type
    -- For now, give 100% to customer wallet (can be enhanced later)
    v_user_wallet_amount := v_total_value;
    
    -- Update wallet with calculated amount and points
    PERFORM update_wallet_balance_main(
        v_collection.customer_id,
        v_user_wallet_amount,
        v_total_points,
        'collection',
        'Collection payment for ' || v_collection.collection_code || ' - ' || v_total_value || ' total value'
    );
    
    -- Update collection status to approved (if not already)
    UPDATE unified_collections 
    SET 
        status = 'approved',
        updated_at = NOW()
    WHERE id = p_collection_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION process_collection_payment_main TO authenticated;


