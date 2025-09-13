-- ============================================================================
-- ENSURE PET BOTTLES REVENUE APPEARS ON GREEN SCHOLAR FUND PAGE - FIXED VERSION
-- ============================================================================
-- This script ensures that:
-- 1. PET Bottles revenue goes 100% to Green Scholar Fund (0% to user wallet)
-- 2. All existing PET Bottles collections are properly processed for Green Scholar Fund
-- 3. The Green Scholar Fund page displays correct PET Bottles contributions
-- 4. Uses correct table structure for green_scholar_fund_balance

-- ============================================================================
-- STEP 1: CHECK AND CREATE GREEN SCHOLAR FUND BALANCE TABLE IF NEEDED
-- ============================================================================

-- Create the table with the correct structure if it doesn't exist
CREATE TABLE IF NOT EXISTS green_scholar_fund_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_balance DECIMAL(10,2) DEFAULT 0.00,
    pet_donations_total DECIMAL(10,2) DEFAULT 0.00,
    direct_donations_total DECIMAL(10,2) DEFAULT 0.00,
    expenses_total DECIMAL(10,2) DEFAULT 0.00,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create the transactions table if it doesn't exist
CREATE TABLE IF NOT EXISTS green_scholar_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('contribution', 'donation', 'distribution', 'expense')),
    amount DECIMAL(10,2) NOT NULL,
    source_type TEXT,
    source_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: PROCESS ALL EXISTING PET BOTTLES COLLECTIONS FOR GREEN SCHOLAR FUND
-- ============================================================================

-- Create a function to process all existing PET Bottles collections
CREATE OR REPLACE FUNCTION process_all_existing_pet_bottles_collections()
RETURNS TABLE (
    collection_id UUID,
    user_id UUID,
    user_email TEXT,
    material_name TEXT,
    weight_kg DECIMAL(10,2),
    total_value DECIMAL(10,2),
    contribution_amount DECIMAL(10,2),
    processed BOOLEAN
) AS $$
DECLARE
    collection_record RECORD;
    contribution_amount DECIMAL(10,2);
    transaction_id UUID;
BEGIN
    -- Loop through all approved PET Bottles collections
    FOR collection_record IN
        SELECT 
            c.id as collection_id,
            c.user_id,
            p.email as user_email,
            m.name as material_name,
            pi.quantity as weight_kg,
            pi.total_price as total_value
        FROM collections c
        JOIN pickup_items pi ON c.id = pi.pickup_id
        JOIN materials m ON pi.material_id = m.id
        JOIN profiles p ON c.user_id = p.id
        WHERE c.status = 'approved'
        AND (LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%')
        ORDER BY c.created_at
    LOOP
        -- Calculate contribution amount (100% of PET Bottles value)
        contribution_amount := collection_record.total_value;
        
        -- Check if this collection has already been processed
        IF NOT EXISTS (
            SELECT 1 FROM green_scholar_transactions 
            WHERE source_type = 'pet_bottles_collection' 
            AND source_id = collection_record.collection_id
        ) THEN
            -- Create Green Scholar Fund transaction
            INSERT INTO green_scholar_transactions (
                transaction_type,
                amount,
                source_type,
                source_id,
                description,
                created_at
            ) VALUES (
                'contribution',
                contribution_amount,
                'pet_bottles_collection',
                collection_record.collection_id,
                'PET Bottles collection contribution (' || collection_record.weight_kg || 'kg @ R' || 
                ROUND(contribution_amount / collection_record.weight_kg, 2) || '/kg)',
                NOW()
            ) RETURNING id INTO transaction_id;
            
            -- Update fund balance
            INSERT INTO green_scholar_fund_balance (
                total_balance,
                pet_donations_total,
                last_updated
            ) VALUES (
                contribution_amount,
                contribution_amount,
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                total_balance = green_scholar_fund_balance.total_balance + contribution_amount,
                pet_donations_total = green_scholar_fund_balance.pet_donations_total + contribution_amount,
                last_updated = NOW();
            
            -- Return processed collection
            collection_id := collection_record.collection_id;
            user_id := collection_record.user_id;
            user_email := collection_record.user_email;
            material_name := collection_record.material_name;
            weight_kg := collection_record.weight_kg;
            total_value := collection_record.total_value;
            contribution_amount := contribution_amount;
            processed := TRUE;
            RETURN NEXT;
        ELSE
            -- Return already processed collection
            collection_id := collection_record.collection_id;
            user_id := collection_record.user_id;
            user_email := collection_record.user_email;
            material_name := collection_record.material_name;
            weight_kg := collection_record.weight_kg;
            total_value := collection_record.total_value;
            contribution_amount := contribution_amount;
            processed := FALSE;
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 3: CREATE FUNCTION TO GET PET BOTTLES CONTRIBUTIONS FOR GREEN SCHOLAR FUND
-- ============================================================================

CREATE OR REPLACE FUNCTION get_pet_bottles_green_scholar_contributions(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    user_id UUID,
    user_email TEXT,
    total_pet_weight DECIMAL(10,2),
    total_pet_value DECIMAL(10,2),
    total_contributions DECIMAL(10,2),
    contribution_count BIGINT,
    last_contribution_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.email as user_email,
        COALESCE(SUM(pi.quantity), 0) as total_pet_weight,
        COALESCE(SUM(pi.total_price), 0) as total_pet_value,
        COALESCE(SUM(gst.amount), 0) as total_contributions,
        COUNT(gst.id) as contribution_count,
        MAX(gst.created_at) as last_contribution_date
    FROM profiles p
    LEFT JOIN collections c ON p.id = c.user_id
    LEFT JOIN pickup_items pi ON c.id = pi.pickup_id
    LEFT JOIN materials m ON pi.material_id = m.id
    LEFT JOIN green_scholar_transactions gst ON c.id = gst.source_id 
        AND gst.source_type = 'pet_bottles_collection'
    WHERE c.status = 'approved'
    AND (LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%')
    AND (p_user_id IS NULL OR p.id = p_user_id)
    GROUP BY p.id, p.email
    ORDER BY total_contributions DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: CREATE FUNCTION TO GET GREEN SCHOLAR FUND TOTAL PET CONTRIBUTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION get_green_scholar_fund_pet_totals()
RETURNS TABLE (
    total_pet_contributions DECIMAL(10,2),
    total_pet_weight DECIMAL(10,2),
    total_pet_collections BIGINT,
    total_users_contributing BIGINT,
    average_contribution DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(gst.amount), 0) as total_pet_contributions,
        COALESCE(SUM(pi.quantity), 0) as total_pet_weight,
        COUNT(DISTINCT c.id) as total_pet_collections,
        COUNT(DISTINCT c.user_id) as total_users_contributing,
        CASE 
            WHEN COUNT(DISTINCT c.user_id) > 0 
            THEN COALESCE(SUM(gst.amount), 0) / COUNT(DISTINCT c.user_id)
            ELSE 0 
        END as average_contribution
    FROM green_scholar_transactions gst
    JOIN collections c ON gst.source_id = c.id
    JOIN pickup_items pi ON c.id = pi.pickup_id
    JOIN materials m ON pi.material_id = m.id
    WHERE gst.source_type = 'pet_bottles_collection'
    AND gst.transaction_type = 'contribution'
    AND c.status = 'approved'
    AND (LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 5: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION process_all_existing_pet_bottles_collections TO authenticated;
GRANT EXECUTE ON FUNCTION get_pet_bottles_green_scholar_contributions TO authenticated;
GRANT EXECUTE ON FUNCTION get_green_scholar_fund_pet_totals TO authenticated;

-- ============================================================================
-- STEP 6: PROCESS ALL EXISTING PET BOTTLES COLLECTIONS
-- ============================================================================

-- Process all existing PET Bottles collections for Green Scholar Fund
SELECT 
    'Processing existing PET Bottles collections for Green Scholar Fund...' as status,
    COUNT(*) as total_collections_processed
FROM process_all_existing_pet_bottles_collections()
WHERE processed = TRUE;

-- ============================================================================
-- STEP 7: VERIFICATION - SHOW PET BOTTLES CONTRIBUTIONS
-- ============================================================================

-- Show total PET Bottles contributions to Green Scholar Fund
SELECT 
    'Green Scholar Fund PET Bottles Totals:' as info,
    total_pet_contributions,
    total_pet_weight,
    total_pet_collections,
    total_users_contributing,
    average_contribution
FROM get_green_scholar_fund_pet_totals();

-- Show top 10 users by PET Bottles contributions
SELECT 
    'Top 10 Users by PET Bottles Contributions:' as info,
    user_email,
    total_pet_weight,
    total_pet_value,
    total_contributions,
    contribution_count,
    last_contribution_date
FROM get_pet_bottles_green_scholar_contributions()
ORDER BY total_contributions DESC
LIMIT 10;

-- Show Green Scholar Fund balance
SELECT 
    'Green Scholar Fund Balance:' as info,
    total_balance,
    pet_donations_total,
    direct_donations_total,
    expenses_total,
    last_updated
FROM green_scholar_fund_balance
ORDER BY last_updated DESC
LIMIT 1;

-- ============================================================================
-- STEP 8: CREATE TRIGGER FOR FUTURE PET BOTTLES COLLECTIONS
-- ============================================================================

-- Create trigger function to automatically process PET Bottles collections
CREATE OR REPLACE FUNCTION auto_process_pet_bottles_for_green_scholar()
RETURNS TRIGGER AS $$
DECLARE
    material_name TEXT;
    contribution_amount DECIMAL(10,2);
    transaction_id UUID;
BEGIN
    -- Only process when collection status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        
        -- Check if this collection contains PET Bottles
        SELECT m.name INTO material_name
        FROM pickup_items pi
        JOIN materials m ON pi.material_id = m.id
        WHERE pi.pickup_id = NEW.id
        AND (LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%')
        LIMIT 1;
        
        IF material_name IS NOT NULL THEN
            -- Calculate contribution amount (100% of PET Bottles value)
            SELECT SUM(pi.total_price) INTO contribution_amount
            FROM pickup_items pi
            JOIN materials m ON pi.material_id = m.id
            WHERE pi.pickup_id = NEW.id
            AND (LOWER(m.name) LIKE '%pet%' OR LOWER(m.name) LIKE '%plastic%');
            
            -- Create Green Scholar Fund transaction
            INSERT INTO green_scholar_transactions (
                transaction_type,
                amount,
                source_type,
                source_id,
                description,
                created_at
            ) VALUES (
                'contribution',
                contribution_amount,
                'pet_bottles_collection',
                NEW.id,
                'Auto-processed PET Bottles collection contribution',
                NOW()
            ) RETURNING id INTO transaction_id;
            
            -- Update fund balance
            INSERT INTO green_scholar_fund_balance (
                total_balance,
                pet_donations_total,
                last_updated
            ) VALUES (
                contribution_amount,
                contribution_amount,
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                total_balance = green_scholar_fund_balance.total_balance + contribution_amount,
                pet_donations_total = green_scholar_fund_balance.pet_donations_total + contribution_amount,
                last_updated = NOW();
            
            RAISE NOTICE 'Auto-processed PET Bottles collection % for Green Scholar Fund: R%', NEW.id, contribution_amount;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS auto_process_pet_bottles_trigger ON collections;
CREATE TRIGGER auto_process_pet_bottles_trigger
    AFTER UPDATE ON collections
    FOR EACH ROW EXECUTE FUNCTION auto_process_pet_bottles_for_green_scholar();

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
    '✅ PET BOTTLES GREEN SCHOLAR FUND INTEGRATION COMPLETE' as status,
    'All existing PET Bottles collections processed for Green Scholar Fund' as action_1,
    'Future PET Bottles collections will be auto-processed' as action_2,
    'Green Scholar Fund page will now display correct PET Bottles contributions' as result;
