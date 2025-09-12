-- ============================================================================
-- FIX WALLET_UPDATE_QUEUE TABLE - SIMPLE VERSION
-- ============================================================================
-- This script creates the wallet_update_queue table without foreign key constraints
-- to avoid dependency issues

-- 1. Create wallet_update_queue table without foreign key constraints
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wallet_update_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- No foreign key constraint to avoid dependency issues
    collection_id UUID,
    resident_email TEXT,
    email TEXT,
    material_name TEXT,
    material TEXT,
    weight_kg DECIMAL(10,2),
    value DECIMAL(10,2),
    status TEXT DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS and create policies
-- ============================================================================

ALTER TABLE public.wallet_update_queue ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view wallet_update_queue" ON public.wallet_update_queue;
DROP POLICY IF EXISTS "Allow authenticated users to insert wallet_update_queue" ON public.wallet_update_queue;
DROP POLICY IF EXISTS "Allow authenticated users to update wallet_update_queue" ON public.wallet_update_queue;
DROP POLICY IF EXISTS "Allow authenticated users to delete wallet_update_queue" ON public.wallet_update_queue;

-- Create permissive RLS policies for wallet_update_queue
CREATE POLICY "Allow authenticated users to view wallet_update_queue" ON public.wallet_update_queue
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to insert wallet_update_queue" ON public.wallet_update_queue
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update wallet_update_queue" ON public.wallet_update_queue
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete wallet_update_queue" ON public.wallet_update_queue
    FOR DELETE USING (auth.role() = 'authenticated');

-- 3. Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_user_id ON public.wallet_update_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_collection_id ON public.wallet_update_queue(collection_id);
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_email ON public.wallet_update_queue(email);
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_resident_email ON public.wallet_update_queue(resident_email);
CREATE INDEX IF NOT EXISTS idx_wallet_update_queue_status ON public.wallet_update_queue(status);

-- 4. Migrate existing transaction data to wallet_update_queue
-- ============================================================================

-- Insert approved collections as wallet update queue entries
INSERT INTO public.wallet_update_queue (
    user_id,
    collection_id,
    resident_email,
    email,
    material_name,
    material,
    weight_kg,
    value,
    status,
    processed_at,
    queued_at,
    created_at
)
SELECT 
    uc.customer_id as user_id,
    uc.id as collection_id,
    uc.customer_email as resident_email,
    uc.customer_email as email,
    'Mixed Materials' as material_name,
    'Mixed Materials' as material,
    uc.total_weight_kg as weight_kg,
    uc.computed_value as value,
    'completed' as status,
    uc.updated_at as processed_at,
    uc.created_at as queued_at,
    uc.created_at
FROM public.unified_collections uc
WHERE uc.status = 'approved'
  AND uc.computed_value > 0
  AND NOT EXISTS (
    SELECT 1 FROM public.wallet_update_queue wuq 
    WHERE wuq.collection_id = uc.id
  );

-- 5. Create a function to sync approved collections to wallet_update_queue
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_approved_collections_to_wallet_queue()
RETURNS INTEGER AS $$
DECLARE
    sync_count INTEGER := 0;
BEGIN
    -- Insert new approved collections that aren't in the queue yet
    INSERT INTO public.wallet_update_queue (
        user_id,
        collection_id,
        resident_email,
        email,
        material_name,
        material,
        weight_kg,
        value,
        status,
        processed_at,
        queued_at,
        created_at
    )
    SELECT 
        uc.customer_id as user_id,
        uc.id as collection_id,
        uc.customer_email as resident_email,
        uc.customer_email as email,
        'Mixed Materials' as material_name,
        'Mixed Materials' as material,
        uc.total_weight_kg as weight_kg,
        uc.computed_value as value,
        'completed' as status,
        uc.updated_at as processed_at,
        uc.created_at as queued_at,
        uc.created_at
    FROM public.unified_collections uc
    WHERE uc.status = 'approved'
      AND uc.computed_value > 0
      AND NOT EXISTS (
        SELECT 1 FROM public.wallet_update_queue wuq 
        WHERE wuq.collection_id = uc.id
      );
    
    GET DIAGNOSTICS sync_count = ROW_COUNT;
    
    RETURN sync_count;
END;
$$ LANGUAGE plpgsql;

-- 6. Create a trigger to automatically add approved collections to wallet_update_queue
-- ============================================================================

CREATE OR REPLACE FUNCTION public.add_approved_collection_to_wallet_queue()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        INSERT INTO public.wallet_update_queue (
            user_id,
            collection_id,
            resident_email,
            email,
            material_name,
            material,
            weight_kg,
            value,
            status,
            processed_at,
            queued_at,
            created_at
        )
        VALUES (
            NEW.customer_id,
            NEW.id,
            NEW.customer_email,
            NEW.customer_email,
            'Mixed Materials',
            'Mixed Materials',
            NEW.total_weight_kg,
            NEW.computed_value,
            'completed',
            NEW.updated_at,
            NEW.created_at,
            NEW.created_at
        )
        ON CONFLICT (collection_id) DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS add_approved_collection_to_wallet_queue_trigger ON public.unified_collections;
CREATE TRIGGER add_approved_collection_to_wallet_queue_trigger
    AFTER UPDATE ON public.unified_collections
    FOR EACH ROW EXECUTE FUNCTION public.add_approved_collection_to_wallet_queue();

-- 7. Run the sync function to populate existing data
-- ============================================================================

SELECT 
    'Syncing approved collections to wallet_update_queue...' as status,
    public.sync_approved_collections_to_wallet_queue() as collections_synced;

-- 8. Verification queries
-- ============================================================================

-- Check wallet_update_queue table structure
SELECT 
    'Wallet Update Queue Table Structure:' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'wallet_update_queue'
ORDER BY ordinal_position;

-- Check if data was migrated
SELECT 
    'Wallet Update Queue Data Summary:' as info,
    COUNT(*) as total_entries,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_entries,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_entries,
    SUM(value) as total_value
FROM public.wallet_update_queue;

-- Check specific user data (legacymusicsa@gmail.com)
SELECT 
    'Legacy Music SA Data:' as info,
    COUNT(*) as total_entries,
    SUM(value) as total_value,
    MIN(created_at) as earliest_entry,
    MAX(created_at) as latest_entry
FROM public.wallet_update_queue 
WHERE email = 'legacymusicsa@gmail.com' 
   OR resident_email = 'legacymusicsa@gmail.com';

-- Show sample entries
SELECT 
    'Sample Wallet Update Queue Entries:' as info,
    id,
    email,
    resident_email,
    material_name,
    weight_kg,
    value,
    status,
    created_at
FROM public.wallet_update_queue 
ORDER BY created_at DESC 
LIMIT 5;

-- 9. Check unified_collections for legacymusicsa@gmail.com
-- ============================================================================

SELECT 
    'Legacy Music SA Unified Collections:' as info,
    COUNT(*) as total_collections,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_collections,
    SUM(CASE WHEN status = 'approved' THEN computed_value ELSE 0 END) as total_approved_value,
    SUM(CASE WHEN status = 'approved' THEN total_weight_kg ELSE 0 END) as total_approved_weight
FROM public.unified_collections 
WHERE customer_email = 'legacymusicsa@gmail.com';

-- Show sample collections
SELECT 
    'Sample Legacy Music SA Collections:' as info,
    id,
    status,
    computed_value,
    total_weight_kg,
    created_at,
    updated_at
FROM public.unified_collections 
WHERE customer_email = 'legacymusicsa@gmail.com'
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT 
    '✅ WALLET_UPDATE_QUEUE FIX COMPLETE (SIMPLE VERSION)' as status,
    'Table created without foreign key constraints to avoid dependency issues' as description,
    'Existing approved collections migrated to wallet_update_queue' as action_taken,
    'Transaction history should now work for all users including legacymusicsa@gmail.com' as result;
