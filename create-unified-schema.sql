-- ============================================================================
-- WOZA MALI UNIFIED SCHEMA
-- ============================================================================
-- This creates a clean, unified schema for all three apps (Main, Collector, Office)
-- Run this in your Supabase SQL Editor to replace all existing tables

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. CORE USER SYSTEM
-- ============================================================================

-- Users table (linked to Supabase auth)
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    login_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User profiles (extended information)
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'collector', 'admin', 'office_staff')),
    date_of_birth DATE,
    emergency_contact TEXT,
    preferences JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User addresses (multiple addresses per user)
CREATE TABLE public.user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    address_type TEXT DEFAULT 'home' CHECK (address_type IN ('home', 'work', 'other')),
    line1 TEXT NOT NULL,
    line2 TEXT,
    suburb TEXT NOT NULL,
    city TEXT NOT NULL,
    postal_code TEXT,
    province TEXT DEFAULT 'Gauteng',
    coordinates POINT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 2. COLLECTION SYSTEM
-- ============================================================================

-- Collection zones (geographic areas)
CREATE TABLE public.collection_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    city TEXT NOT NULL,
    province TEXT DEFAULT 'Gauteng',
    boundaries JSONB, -- GeoJSON polygon
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection schedules
CREATE TABLE public.collection_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    zone_id UUID REFERENCES public.collection_zones(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    schedule_type TEXT DEFAULT 'weekly' CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'custom')),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday
    start_time TIME,
    end_time TIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection requests (user-initiated)
CREATE TABLE public.collection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    address_id UUID REFERENCES public.user_addresses(id) ON DELETE CASCADE NOT NULL,
    zone_id UUID REFERENCES public.collection_zones(id) ON DELETE SET NULL,
    request_type TEXT DEFAULT 'scheduled' CHECK (request_type IN ('scheduled', 'immediate', 'recurring')),
    preferred_date DATE,
    preferred_time TIME,
    special_instructions TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    assigned_collector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Collection pickups (actual execution)
CREATE TABLE public.collection_pickups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.collection_requests(id) ON DELETE CASCADE,
    collector_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    pickup_code TEXT UNIQUE NOT NULL,
    pickup_date DATE NOT NULL,
    pickup_time TIME,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    total_weight_kg DECIMAL(10,2) DEFAULT 0,
    total_value DECIMAL(10,2) DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    notes TEXT,
    customer_feedback TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 3. MATERIALS & PRICING
-- ============================================================================

-- Material categories
CREATE TABLE public.material_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT,
    color TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Materials
CREATE TABLE public.materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.material_categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'piece', 'liter', 'meter')),
    current_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    points_per_unit INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pickup items (materials collected in each pickup)
CREATE TABLE public.pickup_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_id UUID REFERENCES public.collection_pickups(id) ON DELETE CASCADE NOT NULL,
    material_id UUID REFERENCES public.materials(id) ON DELETE CASCADE NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    points_earned INTEGER GENERATED ALWAYS AS (quantity * (SELECT points_per_unit FROM public.materials WHERE id = material_id)) STORED,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pickup photos
CREATE TABLE public.pickup_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pickup_id UUID REFERENCES public.collection_pickups(id) ON DELETE CASCADE NOT NULL,
    photo_url TEXT NOT NULL,
    photo_type TEXT DEFAULT 'general' CHECK (photo_type IN ('before', 'after', 'general', 'verification')),
    uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 4. FINANCIAL SYSTEM
-- ============================================================================

-- User wallets
CREATE TABLE public.user_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_earned DECIMAL(10,2) DEFAULT 0.00,
    total_spent DECIMAL(10,2) DEFAULT 0.00,
    current_points INTEGER DEFAULT 0,
    total_points_earned INTEGER DEFAULT 0,
    total_points_spent INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'withdrawal', 'refund', 'bonus', 'penalty')),
    amount DECIMAL(10,2) NOT NULL,
    points INTEGER DEFAULT 0,
    description TEXT NOT NULL,
    reference_type TEXT, -- 'pickup', 'withdrawal', 'bonus', etc.
    reference_id UUID, -- ID of the related record
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    processed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawal requests
CREATE TABLE public.withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    bank_name TEXT NOT NULL,
    bank_code TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    processed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    failure_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 5. SYSTEM ADMINISTRATION
-- ============================================================================

-- System settings
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================================================

-- User indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_addresses_user_id ON public.user_addresses(user_id);
CREATE INDEX idx_user_addresses_primary ON public.user_addresses(user_id, is_primary) WHERE is_primary = TRUE;

-- Collection indexes
CREATE INDEX idx_collection_requests_user_id ON public.collection_requests(user_id);
CREATE INDEX idx_collection_requests_status ON public.collection_requests(status);
CREATE INDEX idx_collection_requests_date ON public.collection_requests(preferred_date);
CREATE INDEX idx_collection_pickups_collector ON public.collection_pickups(collector_id);
CREATE INDEX idx_collection_pickups_customer ON public.collection_pickups(customer_id);
CREATE INDEX idx_collection_pickups_date ON public.collection_pickups(pickup_date);
CREATE INDEX idx_pickup_items_pickup_id ON public.pickup_items(pickup_id);
CREATE INDEX idx_pickup_items_material_id ON public.pickup_items(material_id);

-- Financial indexes
CREATE INDEX idx_user_wallets_user_id ON public.user_wallets(user_id);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_date ON public.transactions(created_at);
CREATE INDEX idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- System indexes
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_pickups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.material_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Authenticated users can view all users (for admin/collector apps)
CREATE POLICY "Authenticated users can view all users" ON public.users
    FOR SELECT USING (auth.role() = 'authenticated');

-- User profiles policies
CREATE POLICY "Users can view own profile data" ON public.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile data" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view all profiles" ON public.user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- User addresses policies
CREATE POLICY "Users can manage own addresses" ON public.user_addresses
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view all addresses" ON public.user_addresses
    FOR SELECT USING (auth.role() = 'authenticated');

-- Collection requests policies
CREATE POLICY "Users can manage own requests" ON public.collection_requests
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Collectors can view assigned requests" ON public.collection_requests
    FOR SELECT USING (
        auth.uid() = assigned_collector_id OR 
        auth.uid() IN (SELECT user_id FROM public.user_profiles WHERE role = 'collector')
    );

CREATE POLICY "Admins can manage all requests" ON public.collection_requests
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM public.user_profiles WHERE role IN ('admin', 'office_staff'))
    );

-- Collection pickups policies
CREATE POLICY "Users can view own pickups" ON public.collection_pickups
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Collectors can manage assigned pickups" ON public.collection_pickups
    FOR ALL USING (auth.uid() = collector_id);

CREATE POLICY "Admins can manage all pickups" ON public.collection_pickups
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM public.user_profiles WHERE role IN ('admin', 'office_staff'))
    );

-- Materials policies (public read access)
CREATE POLICY "Anyone can view materials" ON public.materials
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Admins can manage materials" ON public.materials
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM public.user_profiles WHERE role IN ('admin', 'office_staff'))
    );

-- User wallets policies
CREATE POLICY "Users can view own wallet" ON public.user_wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet" ON public.user_wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all wallets" ON public.user_wallets
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM public.user_profiles WHERE role IN ('admin', 'office_staff'))
    );

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all transactions" ON public.transactions
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM public.user_profiles WHERE role IN ('admin', 'office_staff'))
    );

-- Withdrawal requests policies
CREATE POLICY "Users can manage own withdrawals" ON public.withdrawal_requests
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all withdrawals" ON public.withdrawal_requests
    FOR ALL USING (
        auth.uid() IN (SELECT user_id FROM public.user_profiles WHERE role IN ('admin', 'office_staff'))
    );

-- Notifications policies
CREATE POLICY "Users can manage own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- 8. FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update wallet when transaction is created
CREATE OR REPLACE FUNCTION update_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user wallet based on transaction
    UPDATE public.user_wallets 
    SET 
        balance = balance + NEW.amount,
        total_earned = total_earned + CASE WHEN NEW.amount > 0 THEN NEW.amount ELSE 0 END,
        total_spent = total_spent + CASE WHEN NEW.amount < 0 THEN ABS(NEW.amount) ELSE 0 END,
        current_points = current_points + NEW.points,
        total_points_earned = total_points_earned + CASE WHEN NEW.points > 0 THEN NEW.points ELSE 0 END,
        total_points_spent = total_points_spent + CASE WHEN NEW.points < 0 THEN ABS(NEW.points) ELSE 0 END,
        last_updated = NOW(),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update wallet on transaction
CREATE TRIGGER trigger_update_wallet
    AFTER INSERT ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_user_wallet();

-- Function to calculate tier based on total points
CREATE OR REPLACE FUNCTION calculate_user_tier(points INTEGER)
RETURNS TEXT AS $$
BEGIN
    RETURN CASE
        WHEN points >= 1000 THEN 'platinum'
        WHEN points >= 500 THEN 'gold'
        WHEN points >= 200 THEN 'silver'
        ELSE 'bronze'
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to update tier when points change
CREATE OR REPLACE FUNCTION update_user_tier()
RETURNS TRIGGER AS $$
BEGIN
    NEW.tier = calculate_user_tier(NEW.current_points);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update tier when wallet is updated
CREATE TRIGGER trigger_update_tier
    BEFORE UPDATE ON public.user_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tier();

-- ============================================================================
-- 9. SAMPLE DATA
-- ============================================================================

-- Insert material categories
INSERT INTO public.material_categories (name, description, icon, color, sort_order) VALUES
('Plastic', 'Various plastic materials', '♻️', '#1E40AF', 1),
('Paper', 'Paper and cardboard materials', '📄', '#059669', 2),
('Metal', 'Metal cans and containers', '🥫', '#DC2626', 3),
('Glass', 'Glass bottles and containers', '🍾', '#7C3AED', 4),
('Electronics', 'Electronic waste', '📱', '#EA580C', 5);

-- Insert materials
INSERT INTO public.materials (category_id, name, description, unit, current_rate, points_per_unit, sort_order) VALUES
((SELECT id FROM public.material_categories WHERE name = 'Plastic'), 'PET Bottles', 'Clear plastic bottles', 'kg', 2.50, 10, 1),
((SELECT id FROM public.material_categories WHERE name = 'Plastic'), 'HDPE Containers', 'Milk jugs, detergent bottles', 'kg', 2.00, 8, 2),
((SELECT id FROM public.material_categories WHERE name = 'Paper'), 'Cardboard', 'Corrugated cardboard boxes', 'kg', 1.50, 6, 3),
((SELECT id FROM public.material_categories WHERE name = 'Paper'), 'Newspaper', 'Old newspapers', 'kg', 1.00, 4, 4),
((SELECT id FROM public.material_categories WHERE name = 'Metal'), 'Aluminum Cans', 'Soda and beer cans', 'kg', 8.00, 20, 5),
((SELECT id FROM public.material_categories WHERE name = 'Metal'), 'Steel Cans', 'Food and beverage cans', 'kg', 3.00, 12, 6),
((SELECT id FROM public.material_categories WHERE name = 'Glass'), 'Glass Bottles', 'Clear and colored glass bottles', 'kg', 0.50, 2, 7),
((SELECT id FROM public.material_categories WHERE name = 'Electronics'), 'Mobile Phones', 'Old mobile phones', 'piece', 50.00, 100, 8);

-- Insert collection zones
INSERT INTO public.collection_zones (name, description, city, province) VALUES
('Zone 1 - Central', 'Central business district and surrounding areas', 'Johannesburg', 'Gauteng'),
('Zone 2 - Northern Suburbs', 'Northern residential areas', 'Johannesburg', 'Gauteng'),
('Zone 3 - Southern Suburbs', 'Southern residential areas', 'Johannesburg', 'Gauteng'),
('Zone 4 - Eastern Suburbs', 'Eastern residential areas', 'Johannesburg', 'Gauteng'),
('Zone 5 - Western Suburbs', 'Western residential areas', 'Johannesburg', 'Gauteng');

-- Insert system settings
INSERT INTO public.system_settings (key, value, description, is_public) VALUES
('app_name', '"WozaMali"', 'Application name', TRUE),
('app_version', '"1.0.0"', 'Current application version', TRUE),
('min_withdrawal_amount', '50.00', 'Minimum withdrawal amount', TRUE),
('max_withdrawal_amount', '5000.00', 'Maximum withdrawal amount', TRUE),
('points_to_rand_ratio', '0.01', 'Points to Rand conversion ratio', TRUE),
('tier_requirements', '{"bronze": 0, "silver": 200, "gold": 500, "platinum": 1000}', 'Tier requirements in points', TRUE);

-- ============================================================================
-- 10. SUCCESS MESSAGE
-- ============================================================================

SELECT 
    '🎉 UNIFIED SCHEMA CREATED SUCCESSFULLY' as status,
    'All tables, policies, and functions have been created' as result,
    'The schema is ready for all three apps to use' as next_step,
    'You can now start using the unified system' as note;
