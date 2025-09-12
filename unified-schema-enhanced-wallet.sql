-- Enhanced Unified Schema for WozaMali with Live Wallet Integration
-- Supports Main App, Office App, and Collector App with real-time wallet data

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. USER MANAGEMENT & PROFILES
-- ============================================================================

-- User profiles table (unified across all apps)
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'resident' CHECK (role IN ('resident', 'collector', 'office', 'admin')),
    area_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Areas table
CREATE TABLE IF NOT EXISTS areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. ADDRESS MANAGEMENT
-- ============================================================================

-- User addresses table (integrated with existing system)
CREATE TABLE IF NOT EXISTS user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    address_type TEXT DEFAULT 'primary' CHECK (address_type IN ('primary', 'secondary', 'pickup', 'billing')),
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT,
    country TEXT DEFAULT 'South Africa',
    coordinates POINT,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_default_per_type UNIQUE (user_id, address_type, is_default) 
        DEFERRABLE INITIALLY DEFERRED
);

-- ============================================================================
-- 3. MATERIALS & PRICING
-- ============================================================================

-- Materials catalog
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    rate_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    points_per_kg INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. COLLECTION & PICKUP SYSTEM
-- ============================================================================

-- Collections table (main pickup/collection tracking)
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
    pickup_address_id UUID REFERENCES user_addresses(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE,
    scheduled_time TIME,
    total_kg DECIMAL(10,2) DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    notes TEXT,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection items (materials in each collection)
CREATE TABLE IF NOT EXISTS collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    quantity DECIMAL(8,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    points_per_kg INTEGER NOT NULL DEFAULT 0, -- Store points per kg at time of collection
    points_earned INTEGER GENERATED ALWAYS AS (quantity * points_per_kg) STORED,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection photos
CREATE TABLE IF NOT EXISTS collection_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type TEXT DEFAULT 'general' CHECK (photo_type IN ('before', 'after', 'general', 'verification')),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES user_profiles(id)
);

-- ============================================================================
-- 5. ENHANCED WALLET SYSTEM (Main App Integration)
-- ============================================================================

-- Main wallets table (unified across all apps)
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    balance DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_points INTEGER NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    total_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_weight_kg DECIMAL(10,2) DEFAULT 0.00,
    environmental_impact JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Wallet transactions (all financial movements)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('collection', 'withdrawal', 'transfer', 'reward', 'penalty', 'bonus', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    points_earned INTEGER DEFAULT 0,
    points_spent INTEGER DEFAULT 0,
    balance_after DECIMAL(10,2) NOT NULL,
    points_after INTEGER NOT NULL,
    description TEXT,
    reference_id UUID, -- Links to collection, withdrawal, etc.
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Points history (detailed points tracking)
CREATE TABLE IF NOT EXISTS points_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('recycling', 'referral', 'bonus', 'redemption', 'penalty', 'adjustment')),
    description TEXT,
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. REWARDS SYSTEM
-- ============================================================================

-- Rewards catalog
CREATE TABLE IF NOT EXISTS rewards_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    points_cost INTEGER NOT NULL,
    monetary_value DECIMAL(10,2) DEFAULT 0.00,
    reward_type TEXT DEFAULT 'physical' CHECK (reward_type IN ('physical', 'digital', 'voucher', 'cash')),
    active BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT -1, -- -1 means unlimited
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reward redemptions
CREATE TABLE IF NOT EXISTS reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES rewards_catalog(id) ON DELETE CASCADE,
    points_spent INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'cancelled')),
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fulfilled_at TIMESTAMP WITH TIME ZONE,
    notes TEXT
);

-- ============================================================================
-- 7. WITHDRAWAL SYSTEM
-- ============================================================================

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    withdrawal_method TEXT NOT NULL CHECK (withdrawal_method IN ('bank_transfer', 'mobile_money', 'cash_pickup')),
    bank_details JSONB, -- Store bank account info securely
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'cancelled')),
    admin_notes TEXT,
    processed_by UUID REFERENCES user_profiles(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================

-- User profiles indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_area_id ON user_profiles(area_id);

-- Address indexes
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_active ON user_addresses(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_addresses_coordinates ON user_addresses USING GIST(coordinates);

-- Collection indexes
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_collector_id ON collections(collector_id);
CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);

-- Collection items indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collection_items_material_id ON collection_items(material_id);

-- Wallet indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallets_tier ON wallets(tier);
CREATE INDEX IF NOT EXISTS idx_wallets_last_updated ON wallets(last_updated);

-- Transaction indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user_id ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_type ON wallet_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON wallet_transactions(created_at);

-- Points history indexes
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_wallet_id ON points_history(wallet_id);
CREATE INDEX IF NOT EXISTS idx_points_history_activity_type ON points_history(activity_type);

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 10. RLS POLICIES
-- ============================================================================

-- User profiles policies
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Office can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('office', 'admin')
        )
    );

-- Areas policies (everyone can read, only office can modify)
CREATE POLICY "Anyone can view areas" ON areas
    FOR SELECT USING (true);

CREATE POLICY "Office can manage areas" ON areas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('office', 'admin')
        )
    );

-- Address policies
CREATE POLICY "Users can view own addresses" ON user_addresses
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own addresses" ON user_addresses
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Office can view all addresses" ON user_addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('office', 'admin')
        )
    );

-- Collections policies
CREATE POLICY "Users can view own collections" ON collections
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create collections" ON collections
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Office can view all collections" ON collections
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('office', 'admin')
        )
    );

CREATE POLICY "Office can update collections" ON collections
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('office', 'admin')
        )
    );

-- Wallet policies
CREATE POLICY "Users can view own wallet" ON wallets
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Office can view all wallets" ON wallets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('office', 'admin')
        )
    );

CREATE POLICY "Office can update wallets" ON wallets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('office', 'admin')
        )
    );

-- Transaction policies
CREATE POLICY "Users can view own transactions" ON wallet_transactions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Office can view all transactions" ON wallet_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('office', 'admin')
        )
    );

CREATE POLICY "Office can create transactions" ON wallet_transactions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.user_id = auth.uid() 
            AND user_profiles.role IN ('office', 'admin')
        )
    );

-- ============================================================================
-- 11. TRIGGERS AND FUNCTIONS
-- ============================================================================

-- Function to update wallet balance and points
CREATE OR REPLACE FUNCTION update_wallet_balance(
    p_user_id UUID,
    p_balance_change DECIMAL(10,2),
    p_points_change INTEGER,
    p_transaction_type TEXT,
    p_description TEXT DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_id UUID;
    v_new_balance DECIMAL(10,2);
    v_new_points INTEGER;
    v_new_tier TEXT;
BEGIN
    -- Get or create wallet
    SELECT id INTO v_wallet_id FROM wallets WHERE user_id = p_user_id;
    
    IF v_wallet_id IS NULL THEN
        INSERT INTO wallets (user_id, balance, total_points)
        VALUES (p_user_id, 0, 0)
        RETURNING id INTO v_wallet_id;
    END IF;
    
    -- Calculate new values
    SELECT 
        balance + p_balance_change,
        total_points + p_points_change
    INTO v_new_balance, v_new_points
    FROM wallets WHERE id = v_wallet_id;
    
    -- Calculate tier based on points
    v_new_tier := CASE
        WHEN v_new_points >= 1000 THEN 'platinum'
        WHEN v_new_points >= 500 THEN 'gold'
        WHEN v_new_points >= 200 THEN 'silver'
        ELSE 'bronze'
    END;
    
    -- Update wallet
    UPDATE wallets 
    SET 
        balance = v_new_balance,
        total_points = v_new_points,
        tier = v_new_tier,
        last_updated = NOW(),
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- Record transaction
    INSERT INTO wallet_transactions (
        wallet_id, user_id, transaction_type, amount, 
        points_earned, points_spent, balance_after, points_after,
        description, reference_id
    ) VALUES (
        v_wallet_id, p_user_id, p_transaction_type, p_balance_change,
        CASE WHEN p_points_change > 0 THEN p_points_change ELSE 0 END,
        CASE WHEN p_points_change < 0 THEN ABS(p_points_change) ELSE 0 END,
        v_new_balance, v_new_points, p_description, p_reference_id
    );
    
    -- Record points history if points changed
    IF p_points_change != 0 THEN
        INSERT INTO points_history (
            user_id, wallet_id, points_change, activity_type, 
            description, reference_id
        ) VALUES (
            p_user_id, v_wallet_id, p_points_change, p_transaction_type,
            p_description, p_reference_id
        );
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate environmental impact
CREATE OR REPLACE FUNCTION calculate_environmental_impact(p_weight_kg DECIMAL)
RETURNS JSONB AS $$
BEGIN
    RETURN jsonb_build_object(
        'co2_saved_kg', p_weight_kg * 2.5, -- Approximate CO2 saved per kg
        'water_saved_liters', p_weight_kg * 100, -- Approximate water saved
        'landfill_saved_kg', p_weight_kg * 0.8, -- Approximate landfill diversion
        'trees_equivalent', p_weight_kg * 0.1 -- Approximate tree equivalent
    );
END;
$$ LANGUAGE plpgsql;

-- Function to update wallet from collection
CREATE OR REPLACE FUNCTION process_collection_payment(
    p_collection_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    v_collection RECORD;
    v_total_value DECIMAL(10,2);
    v_total_points INTEGER;
    v_environmental_impact JSONB;
BEGIN
    -- Get collection details
    SELECT 
        c.*,
        COALESCE(SUM(ci.total_price), 0) as calculated_value,
        COALESCE(SUM(ci.points_earned), 0) as calculated_points
    INTO v_collection
    FROM collections c
    LEFT JOIN collection_items ci ON c.id = ci.collection_id
    WHERE c.id = p_collection_id
    GROUP BY c.id;
    
    IF v_collection.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Calculate environmental impact
    v_environmental_impact := calculate_environmental_impact(v_collection.total_kg);
    
    -- Update wallet
    PERFORM update_wallet_balance(
        v_collection.user_id,
        v_collection.calculated_value,
        v_collection.calculated_points,
        'collection',
        'Collection payment for ' || v_collection.id,
        p_collection_id
    );
    
    -- Update collection with calculated values
    UPDATE collections 
    SET 
        total_value = v_collection.calculated_value,
        total_points = v_collection.calculated_points,
        updated_at = NOW()
    WHERE id = p_collection_id;
    
    -- Update wallet environmental impact
    UPDATE wallets 
    SET 
        environmental_impact = COALESCE(environmental_impact, '{}'::jsonb) || v_environmental_impact,
        total_weight_kg = total_weight_kg + v_collection.total_kg,
        total_earnings = total_earnings + v_collection.calculated_value
    WHERE user_id = v_collection.user_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create collection item with proper points calculation
CREATE OR REPLACE FUNCTION create_collection_item(
    p_collection_id UUID,
    p_material_id UUID,
    p_quantity DECIMAL(8,2),
    p_quality_rating INTEGER DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_item_id UUID;
    v_unit_price DECIMAL(10,2);
    v_points_per_kg INTEGER;
BEGIN
    -- Get current material pricing
    SELECT rate_per_kg, points_per_kg
    INTO v_unit_price, v_points_per_kg
    FROM materials
    WHERE id = p_material_id AND is_active = true;
    
    IF v_unit_price IS NULL THEN
        RAISE EXCEPTION 'Material not found or inactive: %', p_material_id;
    END IF;
    
    -- Create collection item
    INSERT INTO collection_items (
        collection_id,
        material_id,
        quantity,
        unit_price,
        points_per_kg,
        quality_rating,
        notes
    ) VALUES (
        p_collection_id,
        p_material_id,
        p_quantity,
        v_unit_price,
        v_points_per_kg,
        p_quality_rating,
        p_notes
    ) RETURNING id INTO v_item_id;
    
    -- Update collection totals
    UPDATE collections 
    SET 
        total_kg = (
            SELECT COALESCE(SUM(quantity), 0) 
            FROM collection_items 
            WHERE collection_id = p_collection_id
        ),
        total_value = (
            SELECT COALESCE(SUM(total_price), 0) 
            FROM collection_items 
            WHERE collection_id = p_collection_id
        ),
        total_points = (
            SELECT COALESCE(SUM(points_earned), 0) 
            FROM collection_items 
            WHERE collection_id = p_collection_id
        ),
        updated_at = NOW()
    WHERE id = p_collection_id;
    
    RETURN v_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 12. VIEWS FOR LIVE DATA ACCESS
-- ============================================================================

-- Live wallet data view for main app
CREATE OR REPLACE VIEW live_wallet_data AS
SELECT 
    w.id as wallet_id,
    w.user_id,
    up.full_name,
    up.email,
    up.phone,
    w.balance,
    w.total_points,
    w.tier,
    w.total_earnings,
    w.total_weight_kg,
    w.environmental_impact,
    w.last_updated,
    -- Recent activity
    (SELECT COUNT(*) FROM wallet_transactions wt WHERE wt.wallet_id = w.id AND wt.created_at > NOW() - INTERVAL '7 days') as recent_transactions,
    -- Next tier info
    CASE 
        WHEN w.tier = 'bronze' THEN 'silver'
        WHEN w.tier = 'silver' THEN 'gold'
        WHEN w.tier = 'gold' THEN 'platinum'
        ELSE NULL
    END as next_tier,
    CASE 
        WHEN w.tier = 'bronze' THEN 200 - w.total_points
        WHEN w.tier = 'silver' THEN 500 - w.total_points
        WHEN w.tier = 'gold' THEN 1000 - w.total_points
        ELSE 0
    END as points_to_next_tier
FROM wallets w
JOIN user_profiles up ON w.user_id = up.id
WHERE up.is_active = true;

-- Collection summary view
CREATE OR REPLACE VIEW collection_summary AS
SELECT 
    c.user_id,
    COUNT(*) as total_collections,
    COUNT(CASE WHEN c.status = 'completed' THEN 1 END) as completed_collections,
    COUNT(CASE WHEN c.status = 'pending' THEN 1 END) as pending_collections,
    COALESCE(SUM(c.total_kg), 0) as total_weight_kg,
    COALESCE(SUM(c.total_value), 0) as total_value,
    COALESCE(SUM(c.total_points), 0) as total_points
FROM collections c
GROUP BY c.user_id;

-- ============================================================================
-- 13. SAMPLE DATA
-- ============================================================================

-- Insert sample areas
INSERT INTO areas (id, name) VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Cape Town Central'),
    ('550e8400-e29b-41d4-a716-446655440002', 'Cape Town Suburbs'),
    ('550e8400-e29b-41d4-a716-446655440003', 'Cape Town Industrial')
ON CONFLICT (id) DO NOTHING;

-- Insert sample materials
INSERT INTO materials (id, name, category, rate_per_kg, points_per_kg) VALUES 
    ('660e8400-e29b-41d4-a716-446655440001', 'Aluminum Cans', 'Metal', 15.50, 15),
    ('660e8400-e29b-41d4-a716-446655440002', 'Plastic Bottles', 'Plastic', 8.75, 8),
    ('660e8400-e29b-41d4-a716-446655440003', 'Cardboard', 'Paper', 3.25, 3),
    ('660e8400-e29b-41d4-a716-446655440004', 'Glass Bottles', 'Glass', 2.50, 2)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 14. GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT SELECT ON live_wallet_data TO authenticated;
GRANT SELECT ON collection_summary TO authenticated;
