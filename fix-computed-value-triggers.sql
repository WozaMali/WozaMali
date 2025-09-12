-- ============================================================================
-- FIX COMPUTED_VALUE ON PICKUPS PAGE TO REFLECT TRANSACTIONS
-- ============================================================================
-- This script creates triggers to automatically update computed_value in 
-- unified_collections when collection_materials are modified.

-- 1. Create function to update computed_value and total_weight_kg
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_collection_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_collection_id UUID;
    v_computed_value NUMERIC(12,2) := 0;
    v_total_weight NUMERIC(10,2) := 0;
    v_wallet_value NUMERIC(12,2) := 0;
    v_fund_value NUMERIC(12,2) := 0;
BEGIN
    -- Determine which collection_id to update
    IF TG_OP = 'DELETE' THEN
        v_collection_id := OLD.collection_id;
    ELSE
        v_collection_id := NEW.collection_id;
    END IF;

    -- Calculate totals from collection_materials
    -- Split value: 100% of PET material value to Green Scholar Fund; rest to wallet
    SELECT
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(m.name,'')) LIKE '%pet%' THEN 0 ELSE cm.quantity * COALESCE(cm.unit_price, m.current_rate, 0) END), 0)::NUMERIC,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(m.name,'')) LIKE '%pet%' THEN cm.quantity * COALESCE(cm.unit_price, m.current_rate, 0) ELSE 0 END), 0)::NUMERIC,
        COALESCE(SUM(cm.quantity), 0)::NUMERIC
    INTO v_wallet_value, v_fund_value, v_total_weight
    FROM public.collection_materials cm
    LEFT JOIN public.materials m ON m.id = cm.material_id
    WHERE cm.collection_id = v_collection_id;

    -- Total computed value is wallet value + fund value
    v_computed_value := v_wallet_value + v_fund_value;

    -- Update the unified_collections table
    UPDATE public.unified_collections
    SET 
        computed_value = v_computed_value,
        total_value = v_computed_value,  -- Keep both fields in sync
        total_weight_kg = v_total_weight,
        updated_at = NOW()
    WHERE id = v_collection_id;

    -- Return appropriate record
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 2. Create triggers for collection_materials table
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_collection_totals_trigger ON public.collection_materials;

-- Create trigger for INSERT, UPDATE, DELETE operations
CREATE TRIGGER update_collection_totals_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.collection_materials
    FOR EACH ROW EXECUTE FUNCTION public.update_collection_totals();

-- 3. Update existing collections to recalculate computed_value
-- ============================================================================

-- Function to recalculate all collection totals
CREATE OR REPLACE FUNCTION public.recalculate_all_collection_totals()
RETURNS TABLE(collection_id UUID, old_computed_value NUMERIC, new_computed_value NUMERIC, old_total_weight NUMERIC, new_total_weight NUMERIC) AS $$
DECLARE
    rec RECORD;
    v_computed_value NUMERIC(12,2);
    v_total_weight NUMERIC(10,2);
    v_wallet_value NUMERIC(12,2);
    v_fund_value NUMERIC(12,2);
BEGIN
    -- Loop through all collections that have materials
    FOR rec IN 
        SELECT DISTINCT uc.id, uc.computed_value, uc.total_weight_kg
        FROM public.unified_collections uc
        WHERE EXISTS (SELECT 1 FROM public.collection_materials cm WHERE cm.collection_id = uc.id)
    LOOP
        -- Calculate new totals
        SELECT
            COALESCE(SUM(CASE WHEN LOWER(COALESCE(m.name,'')) LIKE '%pet%' THEN 0 ELSE cm.quantity * COALESCE(cm.unit_price, m.current_rate, 0) END), 0)::NUMERIC,
            COALESCE(SUM(CASE WHEN LOWER(COALESCE(m.name,'')) LIKE '%pet%' THEN cm.quantity * COALESCE(cm.unit_price, m.current_rate, 0) ELSE 0 END), 0)::NUMERIC,
            COALESCE(SUM(cm.quantity), 0)::NUMERIC
        INTO v_wallet_value, v_fund_value, v_total_weight
        FROM public.collection_materials cm
        LEFT JOIN public.materials m ON m.id = cm.material_id
        WHERE cm.collection_id = rec.id;

        v_computed_value := v_wallet_value + v_fund_value;

        -- Update the collection
        UPDATE public.unified_collections
        SET 
            computed_value = v_computed_value,
            total_value = v_computed_value,
            total_weight_kg = v_total_weight,
            updated_at = NOW()
        WHERE id = rec.id;

        -- Return the changes for logging
        collection_id := rec.id;
        old_computed_value := rec.computed_value;
        new_computed_value := v_computed_value;
        old_total_weight := rec.total_weight_kg;
        new_total_weight := v_total_weight;
        RETURN NEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. Execute the recalculation for existing data
-- ============================================================================

-- Run the recalculation function and show results
SELECT 
    'Recalculating collection totals...' as status,
    COUNT(*) as collections_updated
FROM public.recalculate_all_collection_totals();

-- Show summary of changes
SELECT 
    'Summary of recalculated collections:' as info,
    COUNT(*) as total_collections,
    SUM(new_computed_value) as total_computed_value,
    SUM(new_total_weight) as total_weight_kg
FROM public.recalculate_all_collection_totals();

-- 5. Create a helper function to manually recalculate a specific collection
-- ============================================================================

CREATE OR REPLACE FUNCTION public.recalculate_collection_total(p_collection_id UUID)
RETURNS TABLE(collection_id UUID, old_computed_value NUMERIC, new_computed_value NUMERIC, old_total_weight NUMERIC, new_total_weight NUMERIC) AS $$
DECLARE
    v_old_computed_value NUMERIC(12,2);
    v_old_total_weight NUMERIC(10,2);
    v_computed_value NUMERIC(12,2);
    v_total_weight NUMERIC(10,2);
    v_wallet_value NUMERIC(12,2);
    v_fund_value NUMERIC(12,2);
BEGIN
    -- Get current values
    SELECT uc.computed_value, uc.total_weight_kg
    INTO v_old_computed_value, v_old_total_weight
    FROM public.unified_collections uc
    WHERE uc.id = p_collection_id;

    -- Calculate new totals
    SELECT
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(m.name,'')) LIKE '%pet%' THEN 0 ELSE cm.quantity * COALESCE(cm.unit_price, m.current_rate, 0) END), 0)::NUMERIC,
        COALESCE(SUM(CASE WHEN LOWER(COALESCE(m.name,'')) LIKE '%pet%' THEN cm.quantity * COALESCE(cm.unit_price, m.current_rate, 0) ELSE 0 END), 0)::NUMERIC,
        COALESCE(SUM(cm.quantity), 0)::NUMERIC
    INTO v_wallet_value, v_fund_value, v_total_weight
    FROM public.collection_materials cm
    LEFT JOIN public.materials m ON m.id = cm.material_id
    WHERE cm.collection_id = p_collection_id;

    v_computed_value := v_wallet_value + v_fund_value;

    -- Update the collection
    UPDATE public.unified_collections
    SET 
        computed_value = v_computed_value,
        total_value = v_computed_value,
        total_weight_kg = v_total_weight,
        updated_at = NOW()
    WHERE id = p_collection_id;

    -- Return the changes
    collection_id := p_collection_id;
    old_computed_value := v_old_computed_value;
    new_computed_value := v_computed_value;
    old_total_weight := v_old_total_weight;
    new_total_weight := v_total_weight;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- 6. Verification queries
-- ============================================================================

-- Check that triggers are created
SELECT 
    'Trigger verification:' as info,
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'update_collection_totals_trigger';

-- Show sample of collections with their computed values
SELECT 
    'Sample collections with computed values:' as info,
    uc.id,
    uc.status,
    uc.computed_value,
    uc.total_value,
    uc.total_weight_kg,
    COUNT(cm.id) as material_count,
    SUM(cm.quantity * cm.unit_price) as manual_calculation
FROM public.unified_collections uc
LEFT JOIN public.collection_materials cm ON cm.collection_id = uc.id
GROUP BY uc.id, uc.status, uc.computed_value, uc.total_value, uc.total_weight_kg
ORDER BY uc.created_at DESC
LIMIT 10;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
    '✅ COMPUTED_VALUE FIX COMPLETE' as status,
    'Triggers created to automatically update computed_value when collection_materials change' as description,
    'All existing collections have been recalculated' as action_taken;
