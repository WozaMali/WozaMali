-- ============================================================================
-- WOZA MALI COMPLETE UNIFIED SCHEMA
-- ============================================================================
-- This schema supports all three apps: Main App, Collector App, Office App
-- with proper wallet system, collections, green scholar fund, and rewards

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CORE IDENTITY TABLES
-- ============================================================================

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Areas table (townships)
CREATE TABLE IF NOT EXISTS public.areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    city TEXT NOT NULL DEFAULT 'Soweto',
    province TEXT DEFAULT 'Gauteng',
    postal_code TEXT,
    subdivisions JSONB DEFAULT '[]',
    boundaries JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table (linked to Supabase auth)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Name fields
    first_name TEXT,
    last_name TEXT,
    full_name TEXT,
    -- Date of birth for age verification
    date_of_birth DATE,
    -- Contact info
    phone TEXT,
    email TEXT UNIQUE,
    -- Role and area assignment
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
    area_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
    -- Address fields
    street_addr TEXT,
    township_id UUID REFERENCES public.areas(id) ON DELETE SET NULL,
    subdivision TEXT,
    city TEXT DEFAULT 'Soweto',
    postal_code TEXT,
    -- Legacy fields for existing users
    suburb TEXT,
    -- System fields
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    last_login TIMESTAMPTZ,
    login_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. MATERIALS AND PRICING SYSTEM
-- ============================================================================

-- Material categories
CREATE TABLE IF NOT EXISTS public.material_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials table
CREATE TABLE IF NOT EXISTS public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES public.material_categories(id) ON DELETE SET NULL,
    description TEXT,
    unit TEXT DEFAULT 'kg',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material rates (current pricing)
CREATE TABLE IF NOT EXISTS public.material_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
    rate_per_kg DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    points_per_kg INTEGER NOT NULL DEFAULT 0,
    green_scholar_percentage DECIMAL(5,2) NOT NULL DEFAULT 70.00, -- 70% to Green Scholar Fund
    is_active BOOLEAN DEFAULT TRUE,
    effective_from TIMESTAMPTZ DEFAULT NOW(),
    effective_to TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. COLLECTION SYSTEM
-- ============================================================================

-- Collection requests (user-initiated)
CREATE TABLE IF NOT EXISTS public.collection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    request_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    scheduled_date DATE,
    scheduled_time TIME,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection pickups (actual pickups by collectors)
CREATE TABLE IF NOT EXISTS public.collection_pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.collection_requests(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    pickup_code TEXT UNIQUE NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    total_weight_kg DECIMAL(10,2) DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    green_scholar_contribution DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pickup items (individual materials collected)
CREATE TABLE IF NOT EXISTS public.pickup_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_id UUID NOT NULL REFERENCES public.collection_pickups(id) ON DELETE CASCADE,
    material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
    weight_kg DECIMAL(10,2) NOT NULL,
    rate_per_kg DECIMAL(10,2) NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    points INTEGER NOT NULL,
    green_scholar_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collection photos
CREATE TABLE IF NOT EXISTS public.collection_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_id UUID NOT NULL REFERENCES public.collection_pickups(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,
    photo_type TEXT DEFAULT 'general' CHECK (photo_type IN ('before', 'after', 'general', 'verification')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID REFERENCES public.users(id)
);

-- ============================================================================
-- 4. WALLET SYSTEM
-- ============================================================================

-- Main wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_points INTEGER NOT NULL DEFAULT 0,
    tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    total_earnings DECIMAL(12,2) DEFAULT 0.00,
    total_weight_kg DECIMAL(10,2) DEFAULT 0.00,
    environmental_impact JSONB DEFAULT '{}',
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet transactions (all financial movements)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('collection_approval', 'adjustment', 'payout', 'reward_redemption', 'donation')),
    source_id UUID,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    points INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. GREEN SCHOLAR FUND SYSTEM
-- ============================================================================

-- Green Scholar Fund balance
CREATE TABLE IF NOT EXISTS public.green_scholar_fund_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_contributions DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_distributions DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Green Scholar Fund transactions
CREATE TABLE IF NOT EXISTS public.green_scholar_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('contribution', 'distribution', 'donation')),
    amount DECIMAL(12,2) NOT NULL,
    source_type TEXT,
    source_id UUID,
    beneficiary_type TEXT CHECK (beneficiary_type IN ('school', 'child_headed_home', 'general')),
    beneficiary_id UUID,
    description TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schools table
CREATE TABLE IF NOT EXISTS public.schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    school_type TEXT CHECK (school_type IN ('primary', 'secondary', 'special_needs')),
    address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    student_count INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Child-headed homes table
CREATE TABLE IF NOT EXISTS public.child_headed_homes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    province TEXT,
    postal_code TEXT,
    contact_person TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    child_count INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User donations to Green Scholar Fund
CREATE TABLE IF NOT EXISTS public.user_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    beneficiary_type TEXT CHECK (beneficiary_type IN ('school', 'child_headed_home', 'general')),
    beneficiary_id UUID,
    is_anonymous BOOLEAN DEFAULT FALSE,
    message TEXT,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. REWARDS SYSTEM
-- ============================================================================

-- Rewards catalog
CREATE TABLE IF NOT EXISTS public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    points_cost INTEGER NOT NULL,
    cash_value DECIMAL(10,2),
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reward redemptions
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.rewards(id) ON DELETE RESTRICT,
    points_used INTEGER NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'fulfilled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. WITHDRAWAL SYSTEM
-- ============================================================================

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    bank_name TEXT,
    account_number TEXT,
    account_holder_name TEXT,
    branch_code TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed')),
    processed_by UUID REFERENCES public.users(id),
    processed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_area ON public.users(area_id);
CREATE INDEX IF NOT EXISTS idx_users_township ON public.users(township_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Collection indexes
CREATE INDEX IF NOT EXISTS idx_collection_requests_user ON public.collection_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_collection_requests_status ON public.collection_requests(status);
CREATE INDEX IF NOT EXISTS idx_collection_pickups_collector ON public.collection_pickups(collector_id);
CREATE INDEX IF NOT EXISTS idx_collection_pickups_customer ON public.collection_pickups(customer_id);
CREATE INDEX IF NOT EXISTS idx_collection_pickups_status ON public.collection_pickups(status);
CREATE INDEX IF NOT EXISTS idx_pickup_items_pickup ON public.pickup_items(pickup_id);
CREATE INDEX IF NOT EXISTS idx_pickup_items_material ON public.pickup_items(material_id);

-- Wallet indexes
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created ON public.wallet_transactions(created_at DESC);

-- Green Scholar Fund indexes
CREATE INDEX IF NOT EXISTS idx_green_scholar_transactions_type ON public.green_scholar_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_green_scholar_transactions_created ON public.green_scholar_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_donations_user ON public.user_donations(user_id);

-- Rewards indexes
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_user ON public.reward_redemptions(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON public.reward_redemptions(status);

-- Withdrawal indexes
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- ============================================================================
-- 9. SAMPLE DATA
-- ============================================================================

-- Insert default roles
INSERT INTO public.roles (name, description) VALUES
('resident', 'Regular users who can request collections and earn rewards'),
('collector', 'Users who collect materials from residents'),
('office', 'Administrative users with full system access')
ON CONFLICT (name) DO NOTHING;

-- Insert default material categories
INSERT INTO public.material_categories (name, description, icon, color) VALUES
('Plastic', 'Various plastic materials', 'plastic', 'blue'),
('Metal', 'Metal cans and containers', 'metal', 'gray'),
('Paper', 'Paper and cardboard', 'paper', 'brown'),
('Glass', 'Glass bottles and containers', 'glass', 'green'),
('PET', 'PET bottles for Green Scholar Fund', 'pet', 'clear')
ON CONFLICT (name) DO NOTHING;

-- Insert default materials
INSERT INTO public.materials (name, category_id, description, unit) VALUES
('Aluminium Cans', (SELECT id FROM public.material_categories WHERE name = 'Metal'), 'Aluminium beverage cans', 'kg'),
('PET Bottles', (SELECT id FROM public.material_categories WHERE name = 'PET'), 'PET plastic bottles', 'kg'),
('Cardboard', (SELECT id FROM public.material_categories WHERE name = 'Paper'), 'Cardboard boxes and packaging', 'kg'),
('Glass Bottles', (SELECT id FROM public.material_categories WHERE name = 'Glass'), 'Glass beverage bottles', 'kg'),
('Plastic Containers', (SELECT id FROM public.material_categories WHERE name = 'Plastic'), 'Various plastic containers', 'kg')
ON CONFLICT DO NOTHING;

-- Insert default material rates
INSERT INTO public.material_rates (material_id, rate_per_kg, points_per_kg, green_scholar_percentage) VALUES
((SELECT id FROM public.materials WHERE name = 'Aluminium Cans'), 15.00, 150, 70.00),
((SELECT id FROM public.materials WHERE name = 'PET Bottles'), 8.00, 80, 100.00), -- 100% to Green Scholar Fund
((SELECT id FROM public.materials WHERE name = 'Cardboard'), 3.00, 30, 70.00),
((SELECT id FROM public.materials WHERE name = 'Glass Bottles'), 2.00, 20, 70.00),
((SELECT id FROM public.materials WHERE name = 'Plastic Containers'), 5.00, 50, 70.00)
ON CONFLICT DO NOTHING;

-- Insert Soweto areas
INSERT INTO public.areas (name, description, city, postal_code, subdivisions) VALUES
('Dobsonville', 'Dobsonville township with Old Dobsonville, Ext 1-5, Ext 7', 'Soweto', '1863', '["Old Dobsonville", "Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5", "Ext 7"]'),
('Orlando East', 'Orlando East township with Zone 1–7', 'Soweto', '1804', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7"]'),
('Orlando West', 'Orlando West township with Zone 1–6, Ext 1–5', 'Soweto', '1804', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5"]'),
('Meadowlands', 'Meadowlands township with Zone 1–12', 'Soweto', '1852', '["Zone 1", "Zone 2", "Zone 3", "Zone 4", "Zone 5", "Zone 6", "Zone 7", "Zone 8", "Zone 9", "Zone 10", "Zone 11", "Zone 12"]'),
('Protea Glen', 'Protea Glen township with Ext 1–31', 'Soweto', '1819', '["Ext 1", "Ext 2", "Ext 3", "Ext 4", "Ext 5", "Ext 6", "Ext 7", "Ext 8", "Ext 9", "Ext 10", "Ext 11", "Ext 12", "Ext 13", "Ext 14", "Ext 15", "Ext 16", "Ext 17", "Ext 18", "Ext 19", "Ext 20", "Ext 21", "Ext 22", "Ext 23", "Ext 24", "Ext 25", "Ext 26", "Ext 27", "Ext 28", "Ext 29", "Ext 30", "Ext 31"]')
ON CONFLICT (name) DO NOTHING;

-- Initialize Green Scholar Fund balance
INSERT INTO public.green_scholar_fund_balance (total_balance, total_contributions, total_distributions) VALUES
(0.00, 0.00, 0.00)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. HELPFUL VIEWS
-- ============================================================================

-- User wallet summary view
CREATE OR REPLACE VIEW public.user_wallet_summary AS
SELECT 
    u.id as user_id,
    u.full_name,
    u.email,
    w.balance,
    w.total_points,
    w.tier,
    w.total_earnings,
    w.total_weight_kg,
    w.environmental_impact,
    w.last_updated
FROM public.users u
LEFT JOIN public.wallets w ON u.id = w.user_id;

-- Collection summary view
CREATE OR REPLACE VIEW public.user_collection_summary AS
SELECT 
    u.id as user_id,
    COUNT(cp.id) as total_pickups,
    COALESCE(SUM(cp.total_weight_kg), 0) as total_weight_kg,
    COALESCE(SUM(cp.total_value), 0) as total_value,
    COALESCE(SUM(cp.total_points), 0) as total_points,
    COALESCE(SUM(cp.green_scholar_contribution), 0) as green_scholar_contribution
FROM public.users u
LEFT JOIN public.collection_pickups cp ON u.id = cp.customer_id AND cp.status = 'completed'
GROUP BY u.id;

-- Material rates view (current active rates)
CREATE OR REPLACE VIEW public.current_material_rates AS
SELECT 
    m.id as material_id,
    m.name as material_name,
    mc.name as category_name,
    mr.rate_per_kg,
    mr.points_per_kg,
    mr.green_scholar_percentage
FROM public.materials m
JOIN public.material_categories mc ON m.category_id = mc.id
JOIN public.material_rates mr ON m.id = mr.material_id
WHERE mr.is_active = TRUE 
AND (mr.effective_to IS NULL OR mr.effective_to > NOW());

-- ============================================================================
-- 11. FUNCTIONS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Function to update wallet when pickup is completed
CREATE OR REPLACE FUNCTION public.update_wallet_on_pickup_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only process when status changes to 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Update or create wallet record
        INSERT INTO public.wallets (user_id, balance, total_points, total_earnings, total_weight_kg, tier)
        VALUES (
            NEW.customer_id,
            NEW.total_value,
            NEW.total_points,
            NEW.total_value,
            NEW.total_weight_kg,
            CASE 
                WHEN NEW.total_weight_kg >= 100 THEN 'platinum'
                WHEN NEW.total_weight_kg >= 50 THEN 'gold'
                WHEN NEW.total_weight_kg >= 20 THEN 'silver'
                ELSE 'bronze'
            END
        )
        ON CONFLICT (user_id) DO UPDATE SET
            balance = wallets.balance + NEW.total_value,
            total_points = wallets.total_points + NEW.total_points,
            total_earnings = wallets.total_earnings + NEW.total_value,
            total_weight_kg = wallets.total_weight_kg + NEW.total_weight_kg,
            tier = CASE 
                WHEN (wallets.total_weight_kg + NEW.total_weight_kg) >= 100 THEN 'platinum'
                WHEN (wallets.total_weight_kg + NEW.total_weight_kg) >= 50 THEN 'gold'
                WHEN (wallets.total_weight_kg + NEW.total_weight_kg) >= 20 THEN 'silver'
                ELSE 'bronze'
            END,
            last_updated = NOW(),
            updated_at = NOW();
        
        -- Create wallet transaction record
        INSERT INTO public.wallet_transactions (user_id, source_type, source_id, amount, points, description)
        VALUES (NEW.customer_id, 'collection_approval', NEW.id, NEW.total_value, NEW.total_points, 'Collection pickup completed');
        
        -- Update Green Scholar Fund
        IF NEW.green_scholar_contribution > 0 THEN
            INSERT INTO public.green_scholar_transactions (transaction_type, amount, source_type, source_id, description)
            VALUES ('contribution', NEW.green_scholar_contribution, 'collection_pickup', NEW.id, 'Contribution from collection pickup');
            
            UPDATE public.green_scholar_fund_balance 
            SET total_balance = total_balance + NEW.green_scholar_contribution,
                total_contributions = total_contributions + NEW.green_scholar_contribution,
                last_updated = NOW(),
                updated_at = NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for pickup completion
CREATE TRIGGER trigger_update_wallet_on_pickup_completion
    AFTER UPDATE ON public.collection_pickups
    FOR EACH ROW
    EXECUTE FUNCTION public.update_wallet_on_pickup_completion();

-- ============================================================================
-- 12. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_donations ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own data
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Users can view their own wallet
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own wallet transactions
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create collection requests
CREATE POLICY "Users can create collection requests" ON public.collection_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own collection requests
CREATE POLICY "Users can view own collection requests" ON public.collection_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own collection pickups
CREATE POLICY "Users can view own collection pickups" ON public.collection_pickups
    FOR SELECT USING (auth.uid() = customer_id);

-- Users can view their own pickup items
CREATE POLICY "Users can view own pickup items" ON public.pickup_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.collection_pickups cp 
            WHERE cp.id = pickup_items.pickup_id 
            AND cp.customer_id = auth.uid()
        )
    );

-- Users can create reward redemptions
CREATE POLICY "Users can create reward redemptions" ON public.reward_redemptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own reward redemptions
CREATE POLICY "Users can view own reward redemptions" ON public.reward_redemptions
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create withdrawal requests
CREATE POLICY "Users can create withdrawal requests" ON public.withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own withdrawal requests
CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Users can create donations
CREATE POLICY "Users can create donations" ON public.user_donations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view their own donations
CREATE POLICY "Users can view own donations" ON public.user_donations
    FOR SELECT USING (auth.uid() = user_id);

-- Public access to read-only tables
CREATE POLICY "Public can view roles" ON public.roles
    FOR SELECT USING (true);

CREATE POLICY "Public can view areas" ON public.areas
    FOR SELECT USING (true);

CREATE POLICY "Public can view materials" ON public.materials
    FOR SELECT USING (true);

CREATE POLICY "Public can view material rates" ON public.material_rates
    FOR SELECT USING (true);

CREATE POLICY "Public can view rewards" ON public.rewards
    FOR SELECT USING (true);

CREATE POLICY "Public can view schools" ON public.schools
    FOR SELECT USING (true);

CREATE POLICY "Public can view child headed homes" ON public.child_headed_homes
    FOR SELECT USING (true);

-- ============================================================================
-- SCHEMA COMPLETE
-- ============================================================================
