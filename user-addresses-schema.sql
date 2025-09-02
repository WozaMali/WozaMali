-- ============================================================================
-- WOZAMALI USER ADDRESSES SCHEMA
-- ============================================================================
-- Dedicated schema for user address management
-- This can be run independently or integrated with the main schema

-- ============================================================================
-- USER ADDRESSES TABLE
-- ============================================================================

-- Check if user_profiles table exists before creating user_addresses
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'user_profiles' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'user_profiles table does not exist. Please run the main schema first.';
    END IF;
END $$;

-- User addresses for flexible location management
CREATE TABLE IF NOT EXISTS public.user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    address_type TEXT DEFAULT 'primary' CHECK (address_type IN ('primary', 'secondary', 'pickup', 'billing')),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    country TEXT DEFAULT 'South Africa',
    coordinates POINT, -- For GPS mapping and route optimization
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT, -- Additional delivery instructions, landmarks, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one default address per user per type
    CONSTRAINT unique_default_per_type UNIQUE (user_id, address_type, is_default) 
        DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================================
-- UPDATE EXISTING COLLECTION PICKUPS TABLE
-- ============================================================================

-- Add new columns to existing collection_pickups table to reference user_addresses
-- Note: These ALTER TABLE statements will only add columns if they don't exist

-- Check if collection_pickups table exists before modifying it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'collection_pickups' 
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'collection_pickups table does not exist. Please run the main schema first.';
    END IF;
END $$;

-- Add customer_id column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collection_pickups' 
        AND column_name = 'customer_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.collection_pickups 
        ADD COLUMN customer_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Add pickup_address_id column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'collection_pickups' 
        AND column_name = 'pickup_address_id'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.collection_pickups 
        ADD COLUMN pickup_address_id UUID REFERENCES public.user_addresses(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp (create if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger for user_addresses (drop and recreate to avoid conflicts)
DROP TRIGGER IF EXISTS update_user_addresses_updated_at ON public.user_addresses;
CREATE TRIGGER update_user_addresses_updated_at 
    BEFORE UPDATE ON public.user_addresses 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user addresses
CREATE OR REPLACE FUNCTION public.get_user_addresses(
    target_user_uuid UUID,
    requesting_user_uuid UUID
)
RETURNS JSONB AS $$
DECLARE
    addresses JSONB;
    result JSONB;
BEGIN
    -- Check if requesting user has permission (own addresses or admin)
    IF NOT (
        target_user_uuid = requesting_user_uuid OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = requesting_user_uuid AND role IN ('admin', 'office_staff')
        )
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to view addresses';
    END IF;
    
    -- Get user addresses
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'address_type', address_type,
            'address_line1', address_line1,
            'address_line2', address_line2,
            'city', city,
            'province', province,
            'postal_code', postal_code,
            'country', country,
            'coordinates', coordinates,
            'is_default', is_default,
            'is_active', is_active,
            'notes', notes,
            'created_at', created_at,
            'updated_at', updated_at
        )
    ) INTO addresses
    FROM public.user_addresses 
    WHERE user_id = target_user_uuid AND is_active = true
    ORDER BY is_default DESC, address_type, created_at;
    
    -- Build result
    result := jsonb_build_object(
        'user_id', target_user_uuid,
        'addresses', COALESCE(addresses, '[]'::jsonb),
        'retrieved_at', NOW()
    );
    
    RETURN result;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to set default address
CREATE OR REPLACE FUNCTION public.set_default_address(
    address_uuid UUID,
    requesting_user_uuid UUID
)
RETURNS JSONB AS $$
DECLARE
    target_user_id UUID;
    address_type_val TEXT;
    result JSONB;
BEGIN
    -- Get address details and verify ownership
    SELECT user_id, address_type INTO target_user_id, address_type_val
    FROM public.user_addresses 
    WHERE id = address_uuid;
    
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'Address not found';
    END IF;
    
    -- Check if requesting user has permission
    IF NOT (
        target_user_id = requesting_user_uuid OR
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE id = requesting_user_uuid AND role IN ('admin', 'office_staff')
        )
    ) THEN
        RAISE EXCEPTION 'Insufficient permissions to modify address';
    END IF;
    
    -- Remove default from other addresses of same type
    UPDATE public.user_addresses 
    SET is_default = false, updated_at = NOW()
    WHERE user_id = target_user_id 
    AND address_type = address_type_val 
    AND id != address_uuid;
    
    -- Set this address as default
    UPDATE public.user_addresses 
    SET is_default = true, updated_at = NOW()
    WHERE id = address_uuid;
    
    -- Return result
    result := jsonb_build_object(
        'success', true,
        'message', 'Default address updated successfully',
        'address_id', address_uuid,
        'address_type', address_type_val,
        'updated_at', NOW()
    );
    
    RETURN result;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Function to get default address for user
CREATE OR REPLACE FUNCTION public.get_default_address(
    target_user_uuid UUID,
    address_type_filter TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    address_record RECORD;
    result JSONB;
BEGIN
    -- Get default address
    SELECT * INTO address_record
    FROM public.user_addresses 
    WHERE user_id = target_user_uuid 
    AND is_default = true 
    AND is_active = true
    AND (address_type_filter IS NULL OR address_type = address_type_filter)
    ORDER BY 
        CASE WHEN address_type_filter IS NULL THEN 
            CASE address_type 
                WHEN 'primary' THEN 1
                WHEN 'pickup' THEN 2
                WHEN 'secondary' THEN 3
                WHEN 'billing' THEN 4
                ELSE 5
            END
        ELSE 0 END
    LIMIT 1;
    
    IF address_record IS NULL THEN
        result := jsonb_build_object(
            'found', false,
            'message', 'No default address found'
        );
    ELSE
        result := jsonb_build_object(
            'found', true,
            'address', jsonb_build_object(
                'id', address_record.id,
                'address_type', address_record.address_type,
                'address_line1', address_record.address_line1,
                'address_line2', address_record.address_line2,
                'city', address_record.city,
                'province', address_record.province,
                'postal_code', address_record.postal_code,
                'country', address_record.country,
                'coordinates', address_record.coordinates,
                'notes', address_record.notes
            )
        );
    END IF;
    
    RETURN result;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on user_addresses table
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Users can manage their own addresses" ON public.user_addresses;
DROP POLICY IF EXISTS "Admins can view all addresses" ON public.user_addresses;

-- User addresses policies
CREATE POLICY "Users can view their own addresses" ON public.user_addresses
    FOR SELECT USING (
        user_id = (
            SELECT id FROM public.user_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own addresses" ON public.user_addresses
    FOR ALL USING (
        user_id = (
            SELECT id FROM public.user_profiles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all addresses" ON public.user_addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'office_staff')
        )
    );

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index for user_id lookups (create if not exists)
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON public.user_addresses(user_id);

-- Index for active addresses (create if not exists)
CREATE INDEX IF NOT EXISTS idx_user_addresses_active ON public.user_addresses(user_id, is_active) WHERE is_active = true;

-- Index for default addresses (create if not exists)
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON public.user_addresses(user_id, address_type, is_default) WHERE is_default = true;

-- Index for coordinates (for spatial queries) (create if not exists)
CREATE INDEX IF NOT EXISTS idx_user_addresses_coordinates ON public.user_addresses USING GIST(coordinates);

-- ============================================================================
-- SAMPLE DATA (Optional)
-- ============================================================================

-- Uncomment to insert sample addresses for testing
/*
-- Sample addresses for testing (replace with actual user IDs)
INSERT INTO public.user_addresses (
    user_id, 
    address_type, 
    address_line1, 
    city, 
    province, 
    postal_code, 
    is_default, 
    notes
) VALUES 
(
    'your-user-id-here', 
    'primary', 
    '123 Main Street', 
    'Cape Town', 
    'Western Cape', 
    '8001', 
    true, 
    'Main residence'
),
(
    'your-user-id-here', 
    'pickup', 
    '456 Business Park', 
    'Cape Town', 
    'Western Cape', 
    '8002', 
    false, 
    'Office building - call when arriving'
);
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify table was created
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_addresses';

-- Verify RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_addresses' 
AND rowsecurity = true;

-- Verify triggers were created
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND event_object_table = 'user_addresses'
ORDER BY trigger_name;

-- Verify functions were created
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%address%'
ORDER BY routine_name;

-- ============================================================================
-- USER ADDRESSES SCHEMA COMPLETE! 🎉
-- ============================================================================
-- Your user addresses system now includes:
-- ✅ Flexible address management (primary, secondary, pickup, billing)
-- ✅ GPS coordinates for route optimization
-- ✅ Default address selection per type
-- ✅ Row-level security for data protection
-- ✅ Helper functions for easy address management
-- ✅ Performance indexes for fast queries
-- ✅ Integration with collection pickups
-- 
-- Usage Examples:
-- 1. Get user addresses: SELECT get_user_addresses('user-id', 'requesting-user-id');
-- 2. Set default address: SELECT set_default_address('address-id', 'user-id');
-- 3. Get default address: SELECT get_default_address('user-id', 'pickup');
-- 
-- Next steps:
-- 1. Run this schema in your database
-- 2. Update your app to use the new address functions
-- 3. Test with sample data
-- 4. Integrate with your collection system
